package com.saipr.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:auth-test;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class AuthIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired PasswordEncoder encoder;

    @BeforeEach void clean() { jdbc.update("DELETE FROM members"); }

    private MockHttpServletRequestBuilder signup(String email, String password, String confirmation) {
        return post("/signup").with(csrf()).param("email", email).param("name", "테스트")
            .param("password", password).param("passwordConfirm", confirmation);
    }
    private void register() throws Exception {
        mvc.perform(signup("member@example.com", "password123!", "password123!"))
            .andExpect(redirectedUrl("/login?registered"));
    }
    private MockHttpSession login() throws Exception {
        return (MockHttpSession) mvc.perform(post("/login").with(csrf())
            .param("email", "member@example.com").param("password", "password123!"))
            .andExpect(authenticated()).andExpect(redirectedUrl("/"))
            .andReturn().getRequest().getSession(false);
    }

    @Test void publicFormsRenderWithCsrf() throws Exception {
        mvc.perform(get("/login")).andExpect(status().isOk())
            .andExpect(content().string(org.hamcrest.Matchers.containsString("name=\"_csrf\"")));
        mvc.perform(get("/signup")).andExpect(status().isOk());
    }
    @Test void registrationNormalizesEmailAndHashesPassword() throws Exception {
        mvc.perform(signup(" Member@Example.COM ", "password123!", "password123!"))
            .andExpect(redirectedUrl("/login?registered")).andExpect(unauthenticated());
        String hash = jdbc.queryForObject("SELECT password_hash FROM members WHERE email='member@example.com'", String.class);
        assertThat(hash).isNotEqualTo("password123!");
        assertThat(encoder.matches("password123!", hash)).isTrue();
    }
    @Test void duplicateEmailRejectedCaseInsensitively() throws Exception {
        register();
        mvc.perform(signup("MEMBER@example.com", "password123!", "password123!"))
            .andExpect(status().isOk()).andExpect(model().attributeHasFieldErrors("signupForm", "email"));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM members", Integer.class)).isEqualTo(1);
    }
    @Test void invalidFieldsAndPasswordMismatchRejected() throws Exception {
        mvc.perform(signup("not-email", "short", "different"))
            .andExpect(model().attributeHasFieldErrors("signupForm", "email", "password", "passwordConfirm"));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM members", Integer.class)).isZero();
    }
    @Test void multibytePasswordBeyondBcryptLimitRejected() throws Exception {
        String password = "가".repeat(25);
        mvc.perform(signup("member@example.com", password, password))
            .andExpect(model().attributeHasFieldErrors("signupForm", "password"));
    }
    @Test void passwordsNeverRepopulateOnValidationFailure() throws Exception {
        mvc.perform(signup("bad", "password123!", "password123!"))
            .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("password123!"))));
    }
    @Test void anonymousRequestsAreDenied() throws Exception {
        mvc.perform(get("/")).andExpect(status().is3xxRedirection());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }
    @Test void sessionPersistsAuthenticationAndOnlyReturnsPublicMemberFields() throws Exception {
        register();
        MockHttpSession session = login();
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("member@example.com"))
            .andExpect(jsonPath("$.name").value("테스트"))
            .andExpect(jsonPath("$.password").doesNotExist())
            .andExpect(jsonPath("$.passwordHash").doesNotExist());
        mvc.perform(get("/").session(session)).andExpect(status().isOk());
    }
    @Test void loginRotatesExistingSessionId() throws Exception {
        register();
        MockHttpSession session = new MockHttpSession();
        String oldId = session.getId();
        mvc.perform(post("/login").session(session).with(csrf())
            .param("email", " MEMBER@EXAMPLE.COM ").param("password", "password123!"))
            .andExpect(authenticated());
        assertThat(session.getId()).isNotEqualTo(oldId);
    }
    @Test void wrongPasswordAndUnknownAccountHaveSameFailureResponse() throws Exception {
        register();
        for (String email : new String[]{"member@example.com", "missing@example.com"}) {
            mvc.perform(post("/login").with(csrf()).param("email", email).param("password", "wrong"))
                .andExpect(redirectedUrl("/login?error")).andExpect(unauthenticated());
        }
    }
    @Test void csrfIsRequiredForAllMutations() throws Exception {
        mvc.perform(post("/signup").param("email", "member@example.com")).andExpect(status().isForbidden());
        mvc.perform(post("/login").param("email", "member@example.com")).andExpect(status().isForbidden());
        register();
        MockHttpSession session = login();
        mvc.perform(post("/logout").session(session)).andExpect(status().isForbidden());
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk());
    }
    @Test void logoutInvalidatesSessionAndDeniesFurtherAnonymousAccess() throws Exception {
        register();
        MockHttpSession session = login();
        mvc.perform(post("/logout").session(session).with(csrf()))
            .andExpect(redirectedUrl("/login?logout")).andExpect(unauthenticated())
            .andExpect(cookie().maxAge("JSESSIONID", 0));
        assertThat(session.isInvalid()).isTrue();
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }
}
