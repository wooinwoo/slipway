# Requirements

What this app must do. Each requirement is linked twice:

- the route file that implements it names it in a header comment (`// REQ-1 ...`), and
- an end-to-end test name starts with it (`test("REQ-1 ...")` in `e2e/`).

`pnpm check:reqs` fails if either link is missing, so a requirement can't be dropped silently.
Add a requirement here first, then build it. Each one is a level-2 heading followed by what the
user can observe, for example `## REQ-1 이메일 로그인` and then "이메일과 비밀번호로 로그인한다.
틀리면 이유를 보여 준다."
