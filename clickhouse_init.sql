CREATE TABLE IF NOT EXISTS orders_log
(
    id UInt64,
    order_id UInt64,
    status_id UInt32,
    ts_changed DateTime
)
ENGINE = MergeTree
ORDER BY (order_id, ts_changed);
