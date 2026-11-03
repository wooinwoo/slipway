# Requirements

What this app must do. Each requirement is linked twice:

- the route file that implements it names it in a header comment (`// REQ-5 ...`), and
- an end-to-end test name starts with it (`test("REQ-5 ...")` in `e2e/`).

`pnpm check:reqs` fails if either link is missing, so a requirement can't be dropped silently.
Add a requirement here first, then build it. REQ-1 to REQ-6 come with the kit.

## REQ-1 게스트 로그인

로그인 화면에서 버튼 한 번으로 가입 없이 들어간다.

## REQ-2 이메일 로그인

이메일과 비밀번호로 로그인한다. 틀리면 이유를 보여 준다. 로그인 후 원래 가려던 페이지로 돌아간다.

## REQ-3 회원가입

이름, 이메일, 8자 이상 비밀번호로 가입하고 바로 로그인된다. 이미 가입된 이메일이면 해당 칸에 표시한다.

## REQ-4 앱 틀

로그인한 사용자만 들어온다. 사이드바로 페이지를 오가고, 상단에 현재 위치가 보이고, 없는 주소는 앱 안에서 안내한다.

## REQ-5 빠른 이동

어느 화면에서든 Ctrl+K(맥은 ⌘K)로 페이지를 찾아 이동하고 테마를 바꾼다.

## REQ-6 설정

테마와 브랜드 색을 바꾸고, 새로고침해도 유지된다.
