# Saipr_project

Java 21 / Spring Boot 4.0.8 / Spring Security 기반 세션 인증 프로젝트입니다.

## 실행

JDK 21을 설치하고 `JAVA_HOME`을 설정한 뒤 프로젝트 루트에서 실행합니다.

```powershell
.\gradlew.bat bootRun
```

macOS/Linux에서는 `sh ./gradlew bootRun`을 실행합니다. 최초 실행 시 Gradle 및 의존성을 다운로드하므로 인터넷 연결이 필요합니다.
브라우저에서 http://localhost:8080 에 접속하면 로그인 화면이 표시됩니다. 회원가입 후 이메일과 비밀번호로 로그인합니다.
IntelliJ에서는 `build.gradle`을 Gradle 프로젝트로 열고 Gradle JVM을 JDK 21로 지정합니다.

## 기능과 인증 흐름

- `GET /signup`: 회원가입 화면
- `POST /signup`: 이름, 이메일, 비밀번호, 비밀번호 확인으로 가입. 성공 시 `/login?registered`로 이동
- `GET /login`: 로그인 화면
- `POST /login`: `email`, `password` 폼 필드로 로그인. 성공 시 `/`, 실패 시 `/login?error`로 이동
- `GET /`: 로그인한 회원 이름과 이메일 표시
- `GET /api/auth/me`: 현재 회원의 `id`, `email`, `name` JSON. 미인증 시 401
- `POST /logout`: 세션 무효화 및 쿠키 제거 후 `/login?logout`로 이동

POST 요청의 Content-Type은 `application/x-www-form-urlencoded`입니다. Thymeleaf 폼에 CSRF 토큰이 자동 포함됩니다. 외부 클라이언트는 먼저 폼 페이지를 요청하여 세션 쿠키와 숨겨진 `_csrf` 필드를 받고, 같은 쿠키와 토큰을 POST에 함께 전송해야 합니다. 로그인 후에는 CSRF 토큰이 교체되므로 새 페이지의 토큰을 사용합니다.

Spring Security가 인증 정보를 서버의 HttpSession에 저장합니다. 브라우저는 HttpOnly / SameSite=Lax인 JSESSIONID 쿠키를 사용하며, URL에 세션 ID를 붙이지 않습니다. 로그인 시 기존 세션 ID를 교체하고, 30분 동안 요청이 없으면 세션이 만료됩니다. 세션은 애플리케이션 메모리에 있으므로 재시작하면 다시 로그인해야 합니다.

이메일은 앞뒤 공백을 제거하고 소문자로 저장/조회합니다. DB UNIQUE 제약으로 동시 가입의 이메일 중복도 차단합니다. 비밀번호는 BCrypt(cost 12)로 해시하며, 8자 이상 및 UTF-8 기준 최대 72바이트를 검증합니다. 검증 실패 화면에 비밀번호를 다시 출력하지 않습니다.

## 데이터 및 환경 설정

기본 DB는 파일 기반 H2(`./data/saipr`)로, 회원 정보는 재시작 후에도 유지됩니다. 데이터 파일은 Git에서 제외됩니다. H2 콘솔은 활성화하지 않았습니다.

| 환경 변수 | 기본값 | 용도 |
| --- | --- | --- |
| `DB_URL` | `jdbc:h2:file:./data/saipr` | 데이터베이스 연결 주소 |
| `DB_USERNAME` | `sa` | DB 사용자 |
| `DB_PASSWORD` | 빈 값 | DB 비밀번호 |
| `SESSION_COOKIE_SECURE` | `false` | HTTPS 배포 시 `true`로 설정 |

기본 설정은 로컬 개발용입니다. HTTPS 배포 시 Secure 쿠키를 활성화하고 DB 자격 증명을 환경 변수로 설정하세요. 다른 DB로 전환할 경우 해당 JDBC 드라이버와 스키마 마이그레이션이 필요합니다. 여러 서버에서 세션을 공유하는 구성, 이메일 소유 확인, 비밀번호 재설정, 로그인 시도 제한은 현재 범위에 포함하지 않습니다.

## 검증

```powershell
.\gradlew.bat test
.\gradlew.bat bootJar
```

통합 테스트는 실제 SecurityFilterChain과 메모리 H2를 사용하여 가입/중복/유효성 검증, 비밀번호 해시, 로그인 성공/실패, 세션 유지 및 ID 갱신, 미인증 접근 차단, CSRF, 로그아웃을 검사합니다.

참고: [Spring Security 폼 로그인](https://docs.spring.io/spring-security/reference/7.0/servlet/authentication/passwords/form.html), [CSRF 보호](https://docs.spring.io/spring-security/reference/7.0/servlet/exploits/csrf.html).
