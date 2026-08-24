DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'NotificationType'
    ) THEN
        CREATE TYPE "NotificationType" AS ENUM (
            'SKILL_REQUEST',
            'WORKSHOP',
            'WORKSHOP_REGISTRATION',
            'SCHEME',
            'ACHIEVEMENT',
            'SYSTEM'
        );
    END IF;
END
$$;
