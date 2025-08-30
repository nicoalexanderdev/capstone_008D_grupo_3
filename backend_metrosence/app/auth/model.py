from uuid import UUID
from pydantic import BaseModel, EmailStr

class RegisterAdminRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    admin_id: str | None = None

    def get_uuid(self) -> UUID | None:
        if self.admin_id:
            return UUID(self.admin_id)
        return None