package com.strateva;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Context-load smoke test. Uses the local PostgreSQL instance via the
 * {@code test} profile (database {@code strateva_test}); the Testcontainers
 * variant in {@link TestcontainersConfiguration} remains available for
 * environments where Docker is installed.
 */
@SpringBootTest
@ActiveProfiles("test")
class StratevaBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
