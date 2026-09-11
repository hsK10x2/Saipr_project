package com.saipr.auth;

import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.Objects;
import jakarta.validation.Valid;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class AuthController {
    private final MemberService members;
    public AuthController(MemberService members) { this.members = members; }

    @GetMapping("/login")
    String login() { return "login"; }

    @GetMapping("/signup")
    String signup(Model model) {
        model.addAttribute("signupForm", new SignupForm());
        return "signup";
    }

    @PostMapping("/signup")
    String register(@Valid @ModelAttribute SignupForm signupForm, BindingResult errors) {
        if (!Objects.equals(signupForm.getPassword(), signupForm.getPasswordConfirm())) {
            errors.rejectValue("passwordConfirm", "mismatch", "비밀번호가 일치하지 않습니다.");
        }
        if (signupForm.getPassword() != null &&
            signupForm.getPassword().getBytes(StandardCharsets.UTF_8).length > 72) {
            errors.rejectValue("password", "tooLong", "비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.");
        }
        if (errors.hasErrors()) return "signup";
        try {
            members.register(signupForm);
        } catch (DuplicateKeyException duplicate) {
            errors.rejectValue("email", "duplicate", "이미 가입된 이메일입니다.");
            return "signup";
        }
        return "redirect:/login?registered";
    }

    @GetMapping("/")
    String home(Principal principal, Model model) {
        model.addAttribute("member", members.find(principal.getName()));
        return "home";
    }

    @GetMapping("/api/auth/me")
    @ResponseBody
    MemberService.MemberView me(Principal principal) { return members.find(principal.getName()); }
}
