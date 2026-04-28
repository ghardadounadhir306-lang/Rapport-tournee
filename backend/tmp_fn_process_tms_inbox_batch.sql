CREATE OR REPLACE FUNCTION public.fn_process_tms_inbox_batch(batch_size integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    rec RECORD;
    v_last_change_id BIGINT := 0;
BEGIN
    -- +éÏ¦ÏºÏíÏ® Ïº+äÏ¦Ï¼+äÏºÏ¬ Ïº+äÏ¬+è +ä+à Ï¬+ÅÏ¦Ïº+äÏ¼ Ï¿Ï¦Ï»
    FOR rec IN 
        SELECT id, source_change_id, operation, raw_payload 
        FROM tms_transport_change_inbox
        WHERE status = 'PENDING'
        ORDER BY source_change_id ASC
        LIMIT batch_size
    LOOP
        BEGIN
            IF rec.operation IN ('INSERT', 'UPDATE') THEN
                INSERT INTO transport_data (
                    otdcode, tiecode, sitcode, toucode, 
                    entnbpal, voydtd, voydtf
                ) VALUES (
                    rec.raw_payload->>'otdcode',
                    rec.raw_payload->>'tiecode',
                    rec.raw_payload->>'sitcode',
                    rec.raw_payload->>'toucode',
                    fn_safe_int(rec.raw_payload->>'entnbpal'),
                    fn_safe_date(rec.raw_payload->>'voydtd'),
                    fn_safe_date(rec.raw_payload->>'voydtf')
                );
            END IF;

            UPDATE tms_transport_change_inbox 
            SET status = 'DONE', processed_at = NOW() 
            WHERE id = rec.id;

            v_last_change_id := rec.source_change_id;

        EXCEPTION WHEN OTHERS THEN
            UPDATE tms_transport_change_inbox 
            SET status = 'ERROR', error_message = SQLERRM, processed_at = NOW() 
            WHERE id = rec.id;
        END;
    END LOOP;

    -- Ï¬Ï¡Ï»+èÏ½ +å+éÏÀÏ® Ïº+äÏ¬+üÏ¬+èÏ¦ Ïº+äÏ«ÏºÏÁÏ® Ï¿+à+ç+àÏ® 'tms_sync' +ü+éÏÀ
    IF v_last_change_id > 0 THEN
        UPDATE sync_state 
        SET last_change_id = v_last_change_id 
        WHERE job_name = 'tms_sync';
    END IF;
END;
$function$

