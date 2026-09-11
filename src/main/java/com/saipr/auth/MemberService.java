package com.saipr.auth;

import java.util.Locale;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemberService implements UserDetailsService {
    private final JdbcClient jdbc;
    private final PasswordEncoder encoder;

    public MemberService(JdbcClient jdbc, PasswordEncoder encoder) {
        this.jdbc = jdbc;
        this.encoder = encoder;
    }

    private static String normalize(String email) { return email.strip().toLowerCase(Locale.ROOT); }

    @Transactional
    public void register(SignupForm form) {
        jdbc.sql("INSERT INTO members (email, name, password_hash) VALUES (:email, :name, :hash)")
            .param("email", normalize(form.getEmail())).param("name", form.getName())
            .param("hash", encoder.encode(form.getPassword())).update();
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return jdbc.sql("SELECT email, password_hash FROM members WHERE email = :email")
            .param("email", normalize(email))
            .query((rs, row) -> User.withUsername(rs.getString("email"))
                .password(rs.getString("password_hash")).roles("USER").build())
            .optional().orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
    }

    public MemberView find(String email) {
        return jdbc.sql("SELECT id, email, name FROM members WHERE email = :email")
            .param("email", normalize(email))
            .query((rs, row) -> new MemberView(rs.getLong("id"), rs.getString("email"), rs.getString("name")))
            .single();
    }

    public record MemberView(long id, String email, String name) {}
}
