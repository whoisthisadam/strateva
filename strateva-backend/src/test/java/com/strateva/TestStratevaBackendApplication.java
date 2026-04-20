package com.strateva;

import org.springframework.boot.SpringApplication;

public class TestStratevaBackendApplication {

	public static void main(String[] args) {
		SpringApplication.from(StratevaBackendApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
