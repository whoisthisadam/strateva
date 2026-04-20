package com.strateva.auth.seed;

import com.strateva.auth.domain.Role;
import com.strateva.auth.domain.User;
import com.strateva.auth.domain.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;

/**
 * Seeds one user per role on every boot when missing.
 * Default credentials are for local development only.
 */
@Configuration
public class UserSeeder {

    private static final Logger log = LoggerFactory.getLogger(UserSeeder.class);

    private record SeedUser(String username, String fullName, Role role) {}

    private static final List<SeedUser> SEED = List.of(
            new SeedUser("pm", "Менеджер проектов", Role.PROJECT_MANAGER),
            new SeedUser("strat", "Стратег", Role.STRATEGIST),
            new SeedUser("ba", "Бизнес-аналитик", Role.BUSINESS_ANALYST)
    );

    @Bean
    public ApplicationRunner seedUsers(UserRepository repository,
                                       PasswordEncoder encoder,
                                       TransactionTemplate tx) {
        return args -> tx.executeWithoutResult(status -> {
            for (SeedUser seed : SEED) {
                if (!repository.existsByUsername(seed.username())) {
                    repository.save(new User(
                            seed.username(),
                            encoder.encode(seed.username() + "Pass1!"),
                            seed.fullName(),
                            seed.role()));
                    log.info("Seeded user '{}' with role {}", seed.username(), seed.role());
                }
            }
        });
    }
}
