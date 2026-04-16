//! Test-only module extracted from scan_cache.rs

#[cfg(test)]
mod tests {
    use crate::scan_cache::*;

    #[test]
    fn cache_miss_on_empty() {
        assert!(cache_get("/no/such/file.tsx", "hash").is_none());
    }

    #[test]
    fn cache_put_and_get_hit() {
        let path = "/tmp/test_scan_cache_button.tsx";
        cache_put(
            path,
            "abc123",
            vec!["bg-blue-500".into(), "text-white".into()],
            1000.0,
            512,
        );
        let result = cache_get(path, "abc123");
        assert!(result.is_some());
        let classes = result.unwrap();
        assert!(classes.contains(&"bg-blue-500".to_string()));
    }

    #[test]
    fn cache_miss_on_hash_mismatch() {
        let path = "/tmp/test_scan_cache_card.tsx";
        cache_put(path, "oldhash", vec!["flex".into()], 1000.0, 256);
        // File changed — different hash
        assert!(cache_get(path, "newhash").is_none());
    }

    #[test]
    fn cache_invalidate_removes_entry() {
        let path = "/tmp/test_scan_cache_rm.tsx";
        cache_put(path, "xyz", vec!["p-4".into()], 1000.0, 100);
        cache_invalidate(path);
        assert!(cache_get(path, "xyz").is_none());
    }

    #[test]
    fn priority_new_file_is_max() {
        let score = priority_score(1000.0, 512, None, 2000.0);
        assert!(score >= 1_000_000_000.0);
    }

    #[test]
    fn priority_changed_beats_unchanged() {
        let old = CacheEntry {
            classes: vec![],
            content_hash: "h".into(),
            mtime_ms: 800.0,
            size: 512,
            hit_count: 2,
            last_seen_ms: 900_000.0,
        };
        let changed = priority_score(1000.0, 512, Some(&old), 1_000_000.0);
        let unchanged = priority_score(800.0, 512, Some(&old), 1_000_000.0);
        assert!(
            changed > unchanged,
            "changed={changed} unchanged={unchanged}"
        );
    }
}
