from fastapi import HTTPException

class LineaError(HTTPException):
    """Base exception for todo-related errors"""
    pass

class LineaNotFoundError(LineaError):
    def __init__(self, linea_id=None):
        message = "Linea not found" if linea_id is None else f"Linea with id {linea_id} not found"
        super().__init__(status_code=404, detail=message)

class LineaCreationError(LineaError):
    def __init__(self, error: str):
        super().__init__(status_code=500, detail=f"Failed to create linea: {error}")

class UserError(HTTPException):
    """Base exception for user-related errors"""
    pass

class UserNotFoundError(UserError):
    def __init__(self, user_id=None):
        message = "User not found" if user_id is None else f"User with id {user_id} not found"
        super().__init__(status_code=404, detail=message)

class PasswordMismatchError(UserError):
    def __init__(self):
        super().__init__(status_code=400, detail="New passwords do not match")

class InvalidPasswordError(UserError):
    def __init__(self):
        super().__init__(status_code=401, detail="Current password is incorrect")

class AuthenticationError(HTTPException):
    def __init__(self, message: str = "Could not validate user"):
        super().__init__(status_code=401, detail=message)
