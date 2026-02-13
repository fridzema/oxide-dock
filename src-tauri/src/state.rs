use std::sync::Mutex;

pub struct AppState {
    pub app_name: String,
    pub visit_count: Mutex<u32>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            app_name: "OxideDock".to_string(),
            visit_count: Mutex::new(0),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_state() {
        let state = AppState::default();
        assert_eq!(state.app_name, "OxideDock");
        assert_eq!(*state.visit_count.lock().unwrap(), 0);
    }

    #[test]
    fn test_visit_count_increment() {
        let state = AppState::default();
        {
            let mut count = state.visit_count.lock().unwrap();
            *count += 1;
        }
        assert_eq!(*state.visit_count.lock().unwrap(), 1);
    }
}
