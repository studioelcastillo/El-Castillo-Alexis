-- Legacy tables extracted from castillo_prod_aws.sql.txt
-- Added only for tables not already present in the current Supabase schema.
-- This file intentionally supplements the current schema without replacing it.

-- accounting_accounts
CREATE TABLE IF NOT EXISTS accounting_accounts (
    accacc_id integer NOT NULL,
    accacc_code character varying(255) NOT NULL,
    accacc_name character varying(255) NOT NULL,
    accacc_number character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- accounting_voucher
CREATE TABLE IF NOT EXISTS accounting_voucher (
    accvou_id integer NOT NULL,
    accvou_description character varying(255),
    accvou_siigo_code smallint NOT NULL,
    accvou_consecutive integer NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- agreements_users_policies
CREATE TABLE IF NOT EXISTS agreements_users_policies (
    aggusrpol_id integer NOT NULL,
    pol_id integer NOT NULL,
    user_id integer NOT NULL,
    aggusrpol_agreement boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- app_clients
CREATE TABLE IF NOT EXISTS app_clients (
    id bigint NOT NULL,
    app_name character varying(255) NOT NULL,
    app_version character varying(255) NOT NULL,
    ip_address character varying(255) NOT NULL,
    hostname character varying(255),
    os_name character varying(255),
    os_version character varying(255),
    os_arch character varying(255),
    cpu_model character varying(255),
    cpu_cores integer,
    total_memory bigint,
    screen_resolution character varying(255),
    user_agent text,
    last_reported_at timestamp(0) without time zone NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- apps
CREATE TABLE IF NOT EXISTS apps (
    id bigint NOT NULL,
    app_name character varying(255) NOT NULL,
    app_description text,
    app_version character varying(255) NOT NULL,
    app_ip character varying(255) NOT NULL,
    app_port character varying(255) NOT NULL,
    app_dwnl_link character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    bright_data_proxy character varying(255),
    bright_data_username character varying(255),
    bright_data_password character varying(255),
    force_update boolean DEFAULT false NOT NULL,
    release_notes text,
    platform_sex_enabled boolean DEFAULT true NOT NULL,
    platform_kwiky_enabled boolean DEFAULT false NOT NULL,
    platform_mode character varying(10) DEFAULT 'sex'::character varying NOT NULL
);

-- banks_accounts
CREATE TABLE IF NOT EXISTS banks_accounts (
    bankacc_id integer NOT NULL,
    std_id integer NOT NULL,
    bankacc_entity character varying(255) NOT NULL,
    bankacc_number character varying(255) NOT NULL,
    bankacc_type character varying(255) NOT NULL,
    bankacc_main boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    bankacc_beneficiary_name character varying(255),
    bankacc_beneficiary_document character varying(255),
    bankacc_beneficiary_document_type character varying(255)
);

-- bot_views
CREATE TABLE IF NOT EXISTS bot_views (
    id bigint NOT NULL,
    model_identifier character varying(255) NOT NULL,
    website character varying(255) NOT NULL,
    view_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address inet,
    user_agent character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- bots
CREATE TABLE IF NOT EXISTS bots (
    id bigint NOT NULL,
    website character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    likes json,
    follows json,
    verified boolean DEFAULT false NOT NULL,
    bot_created_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- cities
CREATE TABLE IF NOT EXISTS cities (
    city_id integer NOT NULL,
    city_name character varying(255) NOT NULL,
    dpto_id integer
);

-- coincidences
CREATE TABLE IF NOT EXISTS coincidences (
    coin_id integer NOT NULL,
    skpcoin_id integer NOT NULL,
    coin_entity json NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- countries
CREATE TABLE IF NOT EXISTS countries (
    country_id integer NOT NULL,
    country_name character varying(255) NOT NULL
);

-- departments
CREATE TABLE IF NOT EXISTS departments (
    dpto_id integer NOT NULL,
    dpto_name character varying(255) NOT NULL,
    country_id integer
);

-- dispenser_files
CREATE TABLE IF NOT EXISTS dispenser_files (
    dispfile_id integer NOT NULL,
    dispfile_filename character varying(255) NOT NULL,
    dispfile_original_filename character varying(255) NOT NULL,
    dispfile_records_success integer DEFAULT 0 NOT NULL,
    dispfile_records_error integer DEFAULT 0 NOT NULL,
    created_by integer,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);

-- document_signatures
CREATE TABLE IF NOT EXISTS document_signatures (
    docsig_id integer NOT NULL,
    stdmod_id integer NOT NULL,
    docsig_document_type character varying(50) NOT NULL,
    docsig_signed_by_user_id integer NOT NULL,
    docsig_role character varying(20) NOT NULL,
    usrsig_id integer,
    docsig_ip_address character varying(45),
    docsig_user_agent text,
    docsig_signed_at timestamp(0) without time zone NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);

-- documents
CREATE TABLE IF NOT EXISTS documents (
    doc_id integer NOT NULL,
    doc_label character varying(150) NOT NULL,
    doc_url character varying(255) NOT NULL,
    doc_type character varying(50) NOT NULL,
    user_id integer,
    usraddmod_id integer,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- exchanges_rates
CREATE TABLE IF NOT EXISTS exchanges_rates (
    exrate_id integer NOT NULL,
    exrate_date date NOT NULL,
    exrate_from character varying(255) NOT NULL,
    exrate_to character varying(255) NOT NULL,
    exrate_rate double precision NOT NULL,
    exrate_type character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);

-- failed_jobs
CREATE TABLE IF NOT EXISTS failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT now() NOT NULL
);

-- jobs
CREATE TABLE IF NOT EXISTS jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);

-- liquidations
CREATE TABLE IF NOT EXISTS liquidations (
    liq_id bigint NOT NULL,
    modacc_id bigint NOT NULL,
    liq_date date NOT NULL,
    liq_period character varying(255) NOT NULL,
    liq_start_at timestamp(0) without time zone,
    liq_finish_at timestamp(0) without time zone,
    liq_price double precision,
    liq_earnings_value double precision NOT NULL,
    liq_earnings_trm double precision,
    liq_earnings_percent double precision,
    liq_earnings_tokens double precision,
    liq_earnings_tokens_rate double precision,
    liq_earnings_usd double precision,
    liq_earnings_eur double precision,
    liq_earnings_cop double precision,
    liq_time double precision,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    modstrfile_id bigint,
    liq_earnings_trm_studio double precision,
    liq_earnings_percent_studio double precision,
    liq_earnings_cop_studio double precision,
    liq_source character varying(255),
    period_id bigint,
    stdmod_id bigint,
    std_id bigint,
    stdacc_id bigint,
    liq_addon character varying(255),
    liq_rtefte_model double precision,
    liq_rtefte_studio double precision,
    modstr_id bigint
);

-- livejasmin_bonus_criteria
CREATE TABLE IF NOT EXISTS livejasmin_bonus_criteria (
    ljbc_id bigint NOT NULL,
    ljbt_id bigint NOT NULL,
    ljbc_api_endpoint character varying(255),
    ljbc_json_path character varying(255),
    ljbc_operator character varying(255) NOT NULL,
    ljbc_target_value numeric(10,2) NOT NULL,
    ljbc_condition_type character varying(255) DEFAULT 'AND'::character varying NOT NULL,
    ljbc_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    ljbc_condition_name character varying(255),
    deleted_at timestamp(0) without time zone,
    ljbc_fixed_type character varying(255)
);

-- livejasmin_bonus_types
CREATE TABLE IF NOT EXISTS livejasmin_bonus_types (
    ljbt_id bigint NOT NULL,
    ljbt_name character varying(255) NOT NULL,
    ljbt_code character varying(255) NOT NULL,
    ljbt_percentage numeric(5,2) NOT NULL,
    ljbt_description text,
    ljbt_target_profiles json,
    ljbt_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);

-- payments_files
CREATE TABLE IF NOT EXISTS payments_files (
    payfile_id integer NOT NULL,
    payfile_description character varying(255) NOT NULL,
    payfile_filename character varying(255) NOT NULL,
    payfile_template character varying(255) NOT NULL,
    payfile_total double precision NOT NULL,
    created_by integer,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);

-- migrations
CREATE TABLE IF NOT EXISTS migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);

-- model_livejasmin_score_bonuses
CREATE TABLE IF NOT EXISTS model_livejasmin_score_bonuses (
    mlsb_id bigint NOT NULL,
    mlsb_evaluation_details json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    modacc_id bigint NOT NULL,
    mlsb_period character varying(255) NOT NULL,
    mlsb_period_start timestamp(0) without time zone NOT NULL,
    mlsb_period_end timestamp(0) without time zone NOT NULL,
    deleted_at timestamp(0) without time zone
);

-- models_livejasmin_scores
CREATE TABLE IF NOT EXISTS models_livejasmin_scores (
    modlj_id bigint NOT NULL,
    modacc_id bigint NOT NULL,
    modlj_screen_name character varying(255) NOT NULL,
    modlj_period_start date NOT NULL,
    modlj_period_end date NOT NULL,
    modlj_hours_connection double precision DEFAULT '0'::double precision NOT NULL,
    modlj_hours_preview double precision DEFAULT '0'::double precision NOT NULL,
    modlj_score_traffic double precision DEFAULT '0'::double precision NOT NULL,
    modlj_score_conversion double precision DEFAULT '0'::double precision NOT NULL,
    modlj_score_engagement double precision DEFAULT '0'::double precision NOT NULL,
    modlj_offers_initiated integer DEFAULT 0 NOT NULL,
    modlj_new_members integer DEFAULT 0 NOT NULL,
    modlj_average_hour double precision DEFAULT '0'::double precision NOT NULL,
    modlj_earnings_usd double precision DEFAULT '0'::double precision NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    modlj_earnings_private double precision DEFAULT '0'::double precision NOT NULL,
    modlj_earnings_vip_show double precision DEFAULT '0'::double precision NOT NULL,
    modlj_earnings_video_voice_call double precision DEFAULT '0'::double precision NOT NULL,
    modlj_earnings_cam2cam double precision DEFAULT '0'::double precision NOT NULL,
    modlj_earnings_surprise double precision DEFAULT '0'::double precision NOT NULL,
    modlj_earnings_message double precision DEFAULT '0'::double precision NOT NULL,
    modlj_earnings_interactive_toy double precision DEFAULT '0'::double precision NOT NULL,
    modlj_earnings_bonus double precision DEFAULT '0'::double precision NOT NULL,
    modlj_earnings_other double precision DEFAULT '0'::double precision NOT NULL,
    modlj_earnings_my_content double precision DEFAULT '0'::double precision NOT NULL,
    modlj_hot_deals integer DEFAULT 0 NOT NULL,
    modlj_hours_total_connection double precision DEFAULT '0'::double precision NOT NULL,
    modlj_hours_member_other double precision DEFAULT '0'::double precision NOT NULL,
    modlj_bonus_5_percent boolean DEFAULT false NOT NULL,
    modlj_bonus_10_percent boolean DEFAULT false NOT NULL,
    modlj_dynamic_bonus_data json
);

-- oauth_access_tokens
CREATE TABLE IF NOT EXISTS oauth_access_tokens (
    id character varying(100) NOT NULL,
    user_id bigint,
    client_id bigint NOT NULL,
    name character varying(255),
    scopes text,
    revoked boolean NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    fcm_token character varying(255)
);

-- oauth_auth_codes
CREATE TABLE IF NOT EXISTS oauth_auth_codes (
    id character varying(100) NOT NULL,
    user_id bigint NOT NULL,
    client_id bigint NOT NULL,
    scopes text,
    revoked boolean NOT NULL,
    expires_at timestamp(0) without time zone
);

-- oauth_clients
CREATE TABLE IF NOT EXISTS oauth_clients (
    id bigint NOT NULL,
    user_id bigint,
    name character varying(255) NOT NULL,
    secret character varying(100),
    provider character varying(255),
    redirect text NOT NULL,
    personal_access_client boolean NOT NULL,
    password_client boolean NOT NULL,
    revoked boolean NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- oauth_personal_access_clients
CREATE TABLE IF NOT EXISTS oauth_personal_access_clients (
    id bigint NOT NULL,
    client_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- oauth_refresh_tokens
CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
    id character varying(100) NOT NULL,
    access_token_id character varying(100) NOT NULL,
    revoked boolean NOT NULL,
    expires_at timestamp(0) without time zone
);

-- password_reset_tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);

-- payroll_additional_concepts
CREATE TABLE IF NOT EXISTS payroll_additional_concepts (
    payroll_concept_id bigint NOT NULL,
    payroll_period_id bigint NOT NULL,
    user_id bigint NOT NULL,
    concept_type character varying(50) NOT NULL,
    description text,
    hours numeric(10,2),
    hourly_rate numeric(12,2),
    surcharge_percentage numeric(5,2),
    total_amount numeric(12,2) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- personal_access_tokens
CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- petitions_states
CREATE TABLE IF NOT EXISTS petitions_states (
    ptnstate_id integer NOT NULL,
    ptn_id integer NOT NULL,
    ptnstate_state character varying(40) NOT NULL,
    ptnstate_observation text,
    user_id integer NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- policies
CREATE TABLE IF NOT EXISTS policies (
    pol_id integer NOT NULL,
    pol_description text NOT NULL,
    pol_active boolean DEFAULT false NOT NULL,
    pol_type character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- setups_commissions
CREATE TABLE IF NOT EXISTS setups_commissions (
    setcomm_id integer NOT NULL,
    std_id integer,
    setcomm_title character varying(255) NOT NULL,
    setcomm_description text,
    setcomm_type character varying(255) DEFAULT 'Porcentaje'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT setups_commissions_setcomm_type_check CHECK (((setcomm_type)::text = ANY ((ARRAY['Porcentaje'::character varying, 'Dolares'::character varying, 'Tokens'::character varying, 'Pesos colombianos'::character varying])::text[])))
);

-- setups_commissions_items
CREATE TABLE IF NOT EXISTS setups_commissions_items (
    setcommitem_id integer NOT NULL,
    setcomm_id integer,
    setcommitem_value double precision NOT NULL,
    setcommitem_limit double precision NOT NULL
);

-- skipped_coincidences
CREATE TABLE IF NOT EXISTS skipped_coincidences (
    skpcoin_id integer NOT NULL,
    user_id_new integer NOT NULL,
    user_id_created_by integer NOT NULL,
    skpcoin_observation text,
    skpcoin_type character varying(50),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- social_accounts
CREATE TABLE IF NOT EXISTS social_accounts (
    soac_id integer NOT NULL,
    provider_id character varying(255) NOT NULL,
    provider_name character varying(255) NOT NULL,
    user_id integer,
    soac_name character varying(255) NOT NULL,
    soac_email character varying(255) NOT NULL,
    soac_avatar character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);

-- studios_goals
CREATE TABLE IF NOT EXISTS studios_goals (
    stdgoal_id integer NOT NULL,
    std_id integer NOT NULL,
    stdgoal_type character varying(255),
    stdgoal_amount double precision NOT NULL,
    stdgoal_percent double precision NOT NULL,
    stdgoal_auto boolean NOT NULL,
    stdgoal_date date NOT NULL,
    stdgoal_reach_goal boolean,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);

-- transactions_commissions
CREATE TABLE IF NOT EXISTS transactions_commissions (
    transmodstr_id integer NOT NULL,
    trans_id integer NOT NULL,
    stdmod_id integer NOT NULL,
    transmodstr_str_value double precision DEFAULT '0'::double precision NOT NULL,
    transmodstr_comm_value double precision DEFAULT '0'::double precision NOT NULL,
    transmodstr_type character varying(255) DEFAULT 'Porcentaje'::character varying NOT NULL,
    transmodstr_percentage double precision DEFAULT '0'::double precision NOT NULL,
    transmodstr_date date NOT NULL,
    CONSTRAINT transactions_commissions_transmodstr_type_check CHECK (((transmodstr_type)::text = ANY ((ARRAY['Porcentaje'::character varying, 'Dolares'::character varying, 'Tokens'::character varying, 'Pesos colombianos'::character varying])::text[])))
);

-- user_signatures
CREATE TABLE IF NOT EXISTS user_signatures (
    usrsig_id integer NOT NULL,
    user_id integer NOT NULL,
    usrsig_image_path character varying(255) NOT NULL,
    usrsig_type character varying(50) DEFAULT 'canvas'::character varying NOT NULL,
    usrsig_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);

-- users_additional_models
CREATE TABLE IF NOT EXISTS users_additional_models (
    usraddmod_id integer NOT NULL,
    usraddmod_identification character varying(40) NOT NULL,
    usraddmod_category character varying(40),
    usraddmod_name character varying(150) NOT NULL,
    usraddmod_birthdate date NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);

-- users_permissions
CREATE TABLE IF NOT EXISTS users_permissions (
    userperm_id integer NOT NULL,
    user_id integer NOT NULL,
    userperm_feature character varying(255) NOT NULL,
    userperm_state character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);

-- users_users
CREATE TABLE IF NOT EXISTS users_users (
    usersusers_id integer NOT NULL,
    userparent_id integer NOT NULL,
    userchild_id integer NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- websockets_statistics_entries
CREATE TABLE IF NOT EXISTS websockets_statistics_entries (
    id integer NOT NULL,
    app_id character varying(255) NOT NULL,
    peak_connection_count integer NOT NULL,
    websocket_message_count integer NOT NULL,
    api_message_count integer NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);
