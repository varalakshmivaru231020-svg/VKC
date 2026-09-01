--
-- PostgreSQL database dump
--

\restrict tTwisGW4criTX4N5QlKTydZqE3l2zrTr4yWY9MpbR9lUjr9KZM3DVlRL8Cx8rd5

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: theme_presets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.theme_presets (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    emoji character varying(10),
    "colorPrimary" character varying(20) NOT NULL,
    "colorGold" character varying(20) NOT NULL,
    "bannerImage" character varying(500),
    "bannerText" character varying(300),
    "eventId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.theme_presets OWNER TO postgres;

--
-- Data for Name: theme_presets; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.theme_presets (id, name, emoji, "colorPrimary", "colorGold", "bannerImage", "bannerText", "eventId", "createdAt", "updatedAt") VALUES ('cmret9qul000szr6q7c2b2uda', 'diwali', NULL, '#290a10', '#f5f2eb', NULL, NULL, NULL, '2026-07-10 10:47:03.211', '2026-07-10 10:47:03.211');


--
-- Name: theme_presets theme_presets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.theme_presets
    ADD CONSTRAINT theme_presets_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict tTwisGW4criTX4N5QlKTydZqE3l2zrTr4yWY9MpbR9lUjr9KZM3DVlRL8Cx8rd5

