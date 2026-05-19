pub fn short_hash(input: &str) -> String {
    let mut h: u64 = 5381;
    for b in input.bytes() {
        h = h.wrapping_mul(33).wrapping_add(b as u64);
    }
    format!("{:06x}", h & 0xFF_FFFF)
}

pub fn serde_json_string(s: &str) -> String {
    serde_json::to_string(s).unwrap_or_else(|_| format!("\"{}\"", s.replace('"', "\\\"")))
}

/// FNV-1a hash — identik dengan `hashContent(key, "fnv", 6)` di TypeScript.
/// Dipakai oleh `ast_extract.rs` dan `state_css.rs` untuk compute
/// component hash yang identik dengan `hashState()` di `stateEngine.ts`.
pub fn fnv1a_6(input: &str) -> String {
    const OFFSET: u64 = 14_695_981_039_346_656_037;
    const PRIME: u64 = 1_099_511_628_211;
    let mut h = OFFSET;
    for b in input.bytes() {
        h ^= b as u64;
        h = h.wrapping_mul(PRIME);
    }
    format!("{:016x}", h)[..6].to_string()
}