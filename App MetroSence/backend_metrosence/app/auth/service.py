from datetime import timedelta, datetime, timezone
from typing import Annotated
from uuid import UUID, uuid4
from fastapi import Depends
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import jwt
from app.entities.admin import Admin
from . import model
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from ..exceptions import AuthenticationError
import logging
import os 
from dotenv import load_dotenv

load_dotenv()

# You would want to store this in an environment variable or a secret manager
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

oauth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/token')
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return bcrypt_context.hash(password)


def authenticate_admin(email: str, password: str, db: Session) -> Admin | bool:
    admin = db.query(Admin).filter(Admin.email == email).first()
    if not admin or not verify_password(password, admin.password_hash):
        logging.warning(f"Failed authentication attempt for email: {email}")
        return False
    return admin


def create_access_token(email: str, admin_id: UUID, expires_delta: timedelta) -> str:
    encode = {
        'sub': email,
        'id': str(admin_id),
        'exp': datetime.now(timezone.utc) + expires_delta
    }
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> model.TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id: str = payload.get('id')
        return model.TokenData(admin_id=admin_id)
    except jwt.ExpiredSignatureError:
        logging.warning("Token has expired")
        raise AuthenticationError("Token has expired")
    except jwt.InvalidTokenError:
        logging.warning("Invalid token")
        raise AuthenticationError("Invalid token")
    except Exception as e:
        logging.warning(f"Token verification failed: {str(e)}")
        raise AuthenticationError("Token verification failed")


def register_admin(db: Session, register_admin_request: model.RegisterAdminRequest) -> None:
    try:
        create_admin_model = Admin(
            id=uuid4(),
            email=register_admin_request.email,
            first_name=register_admin_request.first_name,
            last_name=register_admin_request.last_name,
            password_hash=get_password_hash(register_admin_request.password)
        )    
        db.add(create_admin_model)
        db.commit()
    except Exception as e:
        logging.error(f"Failed to register admin: {register_admin_request.email}. Error: {str(e)}")
        raise
    
    
def get_current_admin(token: Annotated[str, Depends(oauth2_bearer)]) -> model.TokenData:
    return verify_token(token)

CurrentAdmin = Annotated[model.TokenData, Depends(get_current_admin)]


def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
                                 db: Session) -> model.Token:
    admin = authenticate_admin(form_data.username, form_data.password, db)
    if not admin:
        raise AuthenticationError("Invalid credentials")
    token = create_access_token(admin.email, admin.id, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return model.Token(access_token=token, token_type='bearer')