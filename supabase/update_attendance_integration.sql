UPDATE settings
SET set_value = (
  jsonb_set(
    jsonb_set(
      jsonb_set(set_value::jsonb, '{push_interval_seconds}', to_jsonb(120), true),
      '{flush_interval_seconds}', to_jsonb(120), true
    ),
    '{max_batch_size}', to_jsonb(200), true
  )::text
)
WHERE set_key = 'attendance_integration';
