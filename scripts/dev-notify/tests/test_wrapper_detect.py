"""CG2/CG6: the shared wrapper-detection helper must be fail-closed
and must recognize the wrapper across Windows/POSIX/mixed path forms,
case, quoting, and single-element shell-wrapped forms -- never
treating an ambiguous or malformed shape as safe.
"""
import unittest

from dev_notify.wrapper_detect import classify_argv, is_wrapper_argv


class TestWrapperDetect(unittest.TestCase):
    # --- legitimate, non-wrapper commands: must NOT be flagged ---

    def test_legitimate_old_notify_command_is_not_flagged(self):
        self.assertFalse(is_wrapper_argv(["C:/old/notify.exe", "turn-ended"]))

    def test_legitimate_python_script_with_different_name_is_not_flagged(self):
        self.assertFalse(is_wrapper_argv(["python", "/some/other/script.py"]))

    def test_legitimate_command_mentioning_codex_but_not_cli_codex_is_not_flagged(self):
        self.assertFalse(is_wrapper_argv(["C:/Program Files/Codex/some-other-notify-tool.exe", "turn-ended"]))

    # --- the wrapper itself, in every form CG2 names ---

    def test_basename_match_posix(self):
        self.assertTrue(is_wrapper_argv(["python", "/abs/path/to/cli_codex.py"]))

    def test_basename_match_windows_backslash(self):
        self.assertTrue(is_wrapper_argv(["python", "C:\\abs\\path\\to\\cli_codex.py"]))

    def test_case_insensitive_match(self):
        self.assertTrue(is_wrapper_argv(["python", "C:\\ABS\\PATH\\CLI_CODEX.PY"]))

    def test_quoted_path_match(self):
        self.assertTrue(is_wrapper_argv(["python", '"C:\\abs\\path\\cli_codex.py"']))

    def test_mixed_separators_match(self):
        self.assertTrue(is_wrapper_argv(["python", "C:/abs\\path/cli_codex.py"]))

    def test_bare_basename_match(self):
        self.assertTrue(is_wrapper_argv(["cli_codex.py"]))

    def test_single_element_shell_wrapped_substring_match(self):
        # e.g. `cmd /c "C:\abs\path\cli_codex.py" arg` collapsed into one argv element
        self.assertTrue(is_wrapper_argv(['cmd /c "C:\\abs\\path\\cli_codex.py" arg']))

    def test_match_anywhere_in_argv_list_not_just_first_element(self):
        self.assertTrue(is_wrapper_argv(["python", "-u", "/abs/path/cli_codex.py", "extra-arg"]))

    # --- ambiguous/malformed shapes: fail-closed (treated as wrapper-suspicious) ---

    def test_not_a_list_is_fail_closed(self):
        self.assertTrue(is_wrapper_argv("python /abs/path/notify.exe"))
        self.assertTrue(is_wrapper_argv(None))
        self.assertTrue(is_wrapper_argv(42))
        self.assertTrue(is_wrapper_argv({"a": 1}))

    def test_empty_list_is_fail_closed(self):
        self.assertTrue(is_wrapper_argv([]))

    def test_non_string_element_is_fail_closed(self):
        self.assertTrue(is_wrapper_argv(["python", 123]))
        self.assertTrue(is_wrapper_argv([None, "x"]))

    def test_empty_string_element_is_fail_closed(self):
        self.assertTrue(is_wrapper_argv([""]))

    def test_whitespace_only_element_is_fail_closed(self):
        self.assertTrue(is_wrapper_argv(["   "]))

    # --- documented known limitation: unrelated text containing the substring is a safe-direction false positive ---

    def test_unrelated_command_containing_the_substring_is_a_documented_false_positive(self):
        self.assertTrue(is_wrapper_argv(["echo", "this is unrelated to cli_codex.py but mentions it"]))

    # --- PS3: classify_argv() distinguishes "wrapper" from "ambiguous" for reason-text purposes ---

    def test_classify_legitimate_command_is_ok(self):
        self.assertEqual(classify_argv(["C:/old/notify.exe", "turn-ended"]), "ok")

    def test_classify_genuine_wrapper_match_is_wrapper(self):
        self.assertEqual(classify_argv(["python", "/abs/path/cli_codex.py"]), "wrapper")

    def test_classify_ambiguous_shape_is_ambiguous_not_wrapper(self):
        # RF5's own example: a legitimate old command with a stray
        # empty argv element -- fail-closed (still blocks), but must
        # not be reported as "the wrapper" when it demonstrably isn't.
        self.assertEqual(classify_argv(["tool.exe", ""]), "ambiguous")
        self.assertEqual(classify_argv([]), "ambiguous")
        self.assertEqual(classify_argv(None), "ambiguous")
        self.assertEqual(classify_argv("not a list"), "ambiguous")
        self.assertEqual(classify_argv(["tool.exe", 123]), "ambiguous")

    def test_classify_wrapper_takes_precedence_over_ambiguous_in_same_list(self):
        self.assertEqual(classify_argv(["", "/abs/path/cli_codex.py"]), "wrapper")

    def test_is_wrapper_argv_is_exactly_classify_argv_not_ok(self):
        cases = [["C:/old/notify.exe"], ["python", "cli_codex.py"], ["tool.exe", ""], [], None, "x", ["a", 1]]
        for case in cases:
            self.assertEqual(is_wrapper_argv(case), classify_argv(case) != "ok", f"mismatch for {case!r}")


if __name__ == "__main__":
    unittest.main()
