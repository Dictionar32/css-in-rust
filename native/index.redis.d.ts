/**
 * Redis NAPI Function Declarations (Phase 4)
 * These functions are implemented in napi_bridge.rs
 * Type definitions added here to support TypeScript compilation
 */

export declare function redis_pool_connect(host: string, port: number, pool_size?: number): string;
export declare function redis_set(key: string, value: string, ttl_seconds?: number): string;
export declare function redis_get(key: string): string;
export declare function redis_delete(key: string): string;
export declare function redis_mget(keys: Array<string>): string;
export declare function redis_mset(pairs: Array<[string, string]>): string;
export declare function redis_exists(key: string): string;
export declare function redis_expire(key: string, ttl_seconds: number): string;
export declare function redis_ttl(key: string): string;
export declare function redis_pool_stats(): string;
export declare function redis_flush_db(): string;
export declare function redis_ping(): string;
export declare function redis_info(): string;
export declare function redis_cache_clear(): string;
export declare function redis_enable_cluster(enabled: boolean): string;
export declare function redis_cache_hit_rate(): string;
export declare function redis_monitor(): string;
export declare function redis_sync_nodes(): string;
export declare function redis_get_config(): string;
export declare function redis_shutdown(): string;
