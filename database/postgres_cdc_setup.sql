-- ============================================================================
-- POSTGRESQL CHANGE DATA CAPTURE (CDC) TRIGGER & LOGICAL REPLICATION SETUP
-- Project: ETL/ELT Pipeline Optimization for Heterogeneous Sources via CDC
-- ============================================================================

-- ----------------------------------------------------------------------------
-- OPTION A: NATIVE TRIGGER-BASED CDC (Audit Log Capture)
-- Captures row-level INSERTS, UPDATES, and DELETES instantly into cdc_change_log.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_cdc_capture_mutation()
RETURNS TRIGGER AS $$
DECLARE
    v_op VARCHAR(20);
    v_rec_id VARCHAR(100);
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_checksum VARCHAR(64);
BEGIN
    IF (TG_OP = 'INSERT') THEN
        v_op := 'INSERT';
        v_new_data := to_jsonb(NEW);
        IF (TG_TABLE_NAME = 'source_customers') THEN v_rec_id := NEW.customer_id;
        ELSIF (TG_TABLE_NAME = 'source_accounts') THEN v_rec_id := NEW.account_id;
        ELSIF (TG_TABLE_NAME = 'source_transactions') THEN v_rec_id := NEW.transaction_id;
        ELSE v_rec_id := 'UNKNOWN';
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        v_op := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        IF (TG_TABLE_NAME = 'source_customers') THEN v_rec_id := NEW.customer_id;
        ELSIF (TG_TABLE_NAME = 'source_accounts') THEN v_rec_id := NEW.account_id;
        ELSIF (TG_TABLE_NAME = 'source_transactions') THEN v_rec_id := NEW.transaction_id;
        ELSE v_rec_id := 'UNKNOWN';
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        v_op := 'DELETE';
        v_old_data := to_jsonb(OLD);
        IF (TG_TABLE_NAME = 'source_customers') THEN v_rec_id := OLD.customer_id;
        ELSIF (TG_TABLE_NAME = 'source_accounts') THEN v_rec_id := OLD.account_id;
        ELSIF (TG_TABLE_NAME = 'source_transactions') THEN v_rec_id := OLD.transaction_id;
        ELSE v_rec_id := 'UNKNOWN';
        END IF;
    END IF;

    -- Compute SHA256 checksum for idempotency
    v_checksum := encode(digest(TG_TABLE_NAME || ':' || v_rec_id || ':' || v_op || ':' || COALESCE(v_new_data::text, v_old_data::text), 'sha256'), 'hex');

    -- Insert into CDC change log
    INSERT INTO cdc_change_log (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        captured_at,
        is_processed,
        checksum
    ) VALUES (
        TG_TABLE_NAME,
        v_rec_id,
        v_op,
        v_old_data::text,
        v_new_data::text,
        CURRENT_TIMESTAMP,
        FALSE,
        v_checksum
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Attach Triggers to Operational OLTP Tables
DROP TRIGGER IF EXISTS trg_cdc_customers ON source_customers;
CREATE TRIGGER trg_cdc_customers
AFTER INSERT OR UPDATE OR DELETE ON source_customers
FOR EACH ROW EXECUTE FUNCTION fn_cdc_capture_mutation();

DROP TRIGGER IF EXISTS trg_cdc_accounts ON source_accounts;
CREATE TRIGGER trg_cdc_accounts
AFTER INSERT OR UPDATE OR DELETE ON source_accounts
FOR EACH ROW EXECUTE FUNCTION fn_cdc_capture_mutation();

DROP TRIGGER IF EXISTS trg_cdc_transactions ON source_transactions;
CREATE TRIGGER trg_cdc_transactions
AFTER INSERT OR UPDATE OR DELETE ON source_transactions
FOR EACH ROW EXECUTE FUNCTION fn_cdc_capture_mutation();

-- ----------------------------------------------------------------------------
-- OPTION B: NATIVE POSTGRESQL LOGICAL REPLICATION (WAL-Based CDC)
-- Requires wal_level = logical in postgresql.conf
-- ----------------------------------------------------------------------------

-- 1. Create Publication for Debezium / Airflow / Python CDC Reader
-- CREATE PUBLICATION banking_cdc_publication FOR TABLE source_customers, source_accounts, source_transactions;

-- 2. Create Logical Replication Slot
-- SELECT * FROM pg_create_logical_replication_slot('banking_dw_slot', 'pgoutput');

-- 3. Verify Slot Status
-- SELECT slot_name, plugin, active, confirmed_flush_lsn FROM pg_replication_slots;
