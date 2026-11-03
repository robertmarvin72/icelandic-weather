"""#485 iteration-4 -- static import-graph assertion.

Proves, by parsing source with `ast` (not by trusting a comment), that
none of the production modules import anything from `test/` or named
`test_adapter`/`test_transport_child`. This is the "import-graph/source
assertion" the approved prompt requires as proof of isolation, not merely
a claim.
"""
import ast
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PARENT = os.path.dirname(HERE)

PRODUCTION_MODULES = ["provider_target.py", "schema.py", "leak_scanner.py", "limits.py", "secret_policy.py",
                       "ledger.py", "transport_core.py", "child_worker.py", "pipeline.py"]
FORBIDDEN_SUBSTRINGS = ("test_adapter", "test_transport_child", "test.", "_network_guard", "e2e_copy_helper",
                         "_docs_fixture")


def _imported_names(path):
    with open(path, encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=path)
    names = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            names.extend(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                names.append(node.module)
    return names


def check_no_production_module_imports_test_code():
    print("[import-isolation] no production module imports test/test_adapter or test_transport_child ... ", end="")
    violations = []
    for fn in PRODUCTION_MODULES:
        path = os.path.join(PARENT, fn)
        names = _imported_names(path)
        for n in names:
            if any(bad in n for bad in FORBIDDEN_SUBSTRINGS):
                violations.append((fn, n))
    assert not violations, f"RED: production module(s) import test code: {violations}"
    print(f"PASS ({len(PRODUCTION_MODULES)} production modules checked, 0 import test code)")


def check_test_adapter_not_reachable_from_pipeline_public_api():
    print("[import-isolation] pipeline.run_request has no target-override parameter ... ", end="")
    import inspect
    sys.path.insert(0, PARENT)
    import pipeline
    sig = inspect.signature(pipeline.run_request)
    forbidden_param_names = {"host", "port", "path", "url", "target", "verify", "child_script_path"}
    present = forbidden_param_names & set(sig.parameters.keys())
    assert not present, f"RED: run_request() exposes a target/verify override parameter: {present}"
    print(f"PASS (run_request{sig} has no target/verify override)")


def check_run_request_dispatch_call_site_uses_the_literal_child_worker_constant():
    """Not just 'run_request() has no override parameter' -- this parses
    pipeline.py's own source and finds run_request()'s call to
    `_dispatch_child_and_collect`, then asserts its `child_script_path`
    argument (4th positional) is the bare NAME `CHILD_WORKER_PATH`, not a
    parameter, a computed expression, or any other variable -- so nothing
    inside run_request() itself could be smuggling a different script
    path in, even though no test or caller could reach this from outside."""
    print("[import-isolation] run_request()'s dispatch call passes the literal CHILD_WORKER_PATH name ... ", end="")
    path = os.path.join(PARENT, "pipeline.py")
    with open(path, encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=path)

    run_request_fn = None
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == "run_request":
            run_request_fn = node
            break
    assert run_request_fn is not None, "RED: could not find run_request() in pipeline.py's AST"

    calls = [n for n in ast.walk(run_request_fn)
             if isinstance(n, ast.Call) and isinstance(n.func, ast.Name)
             and n.func.id == "_dispatch_child_and_collect"]
    assert len(calls) == 1, f"RED: expected exactly one _dispatch_child_and_collect() call in run_request(), found {len(calls)}"
    call = calls[0]
    assert len(call.args) >= 4, f"RED: _dispatch_child_and_collect() call has fewer than 4 positional args: {ast.dump(call)}"
    fourth_arg = call.args[3]
    assert isinstance(fourth_arg, ast.Name) and fourth_arg.id == "CHILD_WORKER_PATH", (
        f"RED: run_request()'s dispatch call's 4th argument is not the literal name "
        f"CHILD_WORKER_PATH: {ast.dump(fourth_arg)}")
    print("PASS (AST-verified: the 4th positional argument is the bare name CHILD_WORKER_PATH, "
          "not a parameter or computed expression)")


def main():
    check_no_production_module_imports_test_code()
    check_test_adapter_not_reachable_from_pipeline_public_api()
    check_run_request_dispatch_call_site_uses_the_literal_child_worker_constant()
    print("\nALL IMPORT-ISOLATION CHECKS PASS (exit 0).")


if __name__ == "__main__":
    main()
