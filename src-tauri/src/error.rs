use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Validation failed: {0}")]
    Validation(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let (code, message) = match self {
            AppError::Validation(msg) => ("VALIDATION", msg.as_str()),
            AppError::Internal(msg) => ("INTERNAL", msg.as_str()),
        };
        let mut s = serializer.serialize_struct("AppError", 2)?;
        s.serialize_field("code", code)?;
        s.serialize_field("message", message)?;
        s.end()
    }
}

pub type AppResult<T> = Result<T, AppError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validation_error_serializes_to_json() {
        let err = AppError::Validation("Name cannot be empty".to_string());
        let json = serde_json::to_value(&err).unwrap();
        assert_eq!(json["code"], "VALIDATION");
        assert_eq!(json["message"], "Name cannot be empty");
    }

    #[test]
    fn test_internal_error_serializes_to_json() {
        let err = AppError::Internal("Unexpected failure".to_string());
        let json = serde_json::to_value(&err).unwrap();
        assert_eq!(json["code"], "INTERNAL");
        assert_eq!(json["message"], "Unexpected failure");
    }

    #[test]
    fn test_validation_error_display() {
        let err = AppError::Validation("bad input".to_string());
        assert_eq!(format!("{err}"), "Validation failed: bad input");
    }

    #[test]
    fn test_internal_error_display() {
        let err = AppError::Internal("oops".to_string());
        assert_eq!(format!("{err}"), "Internal error: oops");
    }

    #[test]
    fn test_app_result_ok() {
        let result: AppResult<String> = Ok("success".to_string());
        assert!(result.is_ok());
    }

    #[test]
    fn test_app_result_err() {
        let result: AppResult<String> = Err(AppError::Validation("fail".to_string()));
        assert!(result.is_err());
    }
}
