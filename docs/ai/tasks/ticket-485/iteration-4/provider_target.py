"""#485 iteration-4 -- the ONE fixed, immutable provider destination.

Deliberately has no functions, no parameters, no way for any caller to
override any of these values. `pipeline.py` imports these names directly;
nothing in this module accepts a host/port/path/scheme argument from
anywhere. This is the structural fix for iteration-3's actual defect:
`build_keyed_url()` was a mere string-constructor that callers could
ignore; here there is no constructor to ignore -- the values are module
constants, full stop.
"""

PROVIDER_SCHEME = "https"
PROVIDER_HOST = "customer-api.open-meteo.com"
PROVIDER_PORT = 443
PROVIDER_PATH = "/v1/forecast"

# Frozen for reference/equality checks only -- never passed to a transport
# function as a parameter from outside this module.
FIXED_TARGET = (PROVIDER_SCHEME, PROVIDER_HOST, PROVIDER_PORT, PROVIDER_PATH)
