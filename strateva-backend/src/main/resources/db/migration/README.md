# Flyway migrations

The single baseline migration `V1__initial_schema.sql` is generated in **Phase 9.3a**
once the domain model is locked. Until then this directory intentionally stays empty,
Flyway is disabled in the `dev` profile (Hibernate `ddl-auto: update` is the source of
truth for local development), and the `prod` profile will refuse to start without a
migration once it is enabled in deployment environments.
