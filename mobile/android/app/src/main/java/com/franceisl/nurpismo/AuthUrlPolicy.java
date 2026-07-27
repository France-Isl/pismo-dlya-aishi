package com.franceisl.nurpismo;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/** Exact allow-list for the public OAuth URLs the native shell is permitted to handle. */
final class AuthUrlPolicy {
    static final String SUPABASE_HOST = "xzzngrquomyiglktroqi.supabase.co";
    static final String AUTHORIZE_PATH = "/auth/v1/authorize";
    static final String CALLBACK_SCHEME = "com.franceisl.nurpismo";
    static final String CALLBACK_HOST = "auth";
    static final String CALLBACK_PATH = "/callback";
    static final String CALLBACK_URL = CALLBACK_SCHEME + "://" + CALLBACK_HOST + CALLBACK_PATH;
    private static final Pattern PKCE_CHALLENGE = Pattern.compile("^[A-Za-z0-9_-]{43,128}$");
    private static final String[] CALLBACK_SINGLETON_PARAMETERS = {
            "code",
            "error",
            "error_code",
            "error_description",
            "state",
            "access_token",
            "refresh_token",
            "provider_token",
            "provider_refresh_token"
    };

    private AuthUrlPolicy() {}

    static boolean isAllowedAuthorizeUrl(String candidate) {
        URI uri = parseAbsolute(candidate);
        if (uri == null
                || !"https".equalsIgnoreCase(uri.getScheme())
                || !hasExactAuthority(uri, SUPABASE_HOST)
                || !AUTHORIZE_PATH.equals(uri.getRawPath())
                || uri.getRawFragment() != null) {
            return false;
        }

        Map<String, List<String>> query = parseQuery(uri.getRawQuery());
        if (query == null) {
            return false;
        }
        String provider = singleValue(query, "provider");
        String redirect = singleValue(query, "redirect_to");
        String challenge = singleValue(query, "code_challenge");
        String method = singleValue(query, "code_challenge_method");
        return ("google".equals(provider) || "facebook".equals(provider))
                && CALLBACK_URL.equals(redirect)
                && challenge != null
                && PKCE_CHALLENGE.matcher(challenge).matches()
                && method != null
                && "s256".equalsIgnoreCase(method);
    }

    static boolean isAllowedCallbackUrl(String candidate) {
        URI uri = parseAbsolute(candidate);
        if (uri == null
                || !CALLBACK_SCHEME.equalsIgnoreCase(uri.getScheme())
                || !hasExactAuthority(uri, CALLBACK_HOST)
                || !CALLBACK_PATH.equals(uri.getRawPath())
                || uri.getRawFragment() != null) {
            return false;
        }

        Map<String, List<String>> query = parseQuery(uri.getRawQuery());
        if (query == null) {
            return false;
        }
        for (String parameter : CALLBACK_SINGLETON_PARAMETERS) {
            List<String> values = query.get(parameter);
            if (values != null && values.size() > 1) {
                return false;
            }
        }
        return true;
    }

    private static URI parseAbsolute(String candidate) {
        if (candidate == null || candidate.trim().isEmpty()) {
            return null;
        }
        try {
            URI uri = new URI(candidate);
            return uri.isAbsolute() && !uri.isOpaque() ? uri : null;
        } catch (URISyntaxException ignored) {
            return null;
        }
    }

    private static boolean hasExactAuthority(URI uri, String expectedHost) {
        return uri.getHost() != null
                && expectedHost.equalsIgnoreCase(uri.getHost())
                && uri.getUserInfo() == null
                && uri.getPort() == -1;
    }

    private static Map<String, List<String>> parseQuery(String rawQuery) {
        Map<String, List<String>> result = new HashMap<>();
        if (rawQuery == null || rawQuery.isEmpty()) {
            return result;
        }
        String[] pairs = rawQuery.split("&", -1);
        for (String pair : pairs) {
            if (pair.isEmpty()) {
                return null;
            }
            int separator = pair.indexOf('=');
            String rawName = separator >= 0 ? pair.substring(0, separator) : pair;
            String rawValue = separator >= 0 ? pair.substring(separator + 1) : "";
            String name = decodeQueryComponent(rawName);
            String value = decodeQueryComponent(rawValue);
            if (name == null
                    || name.isEmpty()
                    || value == null
                    || containsControlCharacter(name)
                    || containsControlCharacter(value)) {
                return null;
            }
            List<String> values = result.get(name);
            if (values == null) {
                values = new ArrayList<>();
                result.put(name, values);
            }
            values.add(value);
        }
        return result;
    }

    private static String singleValue(Map<String, List<String>> query, String name) {
        List<String> values = query.get(name);
        return values != null && values.size() == 1 ? values.get(0) : null;
    }

    private static String decodeQueryComponent(String value) {
        try {
            return URLDecoder.decode(value, "UTF-8");
        } catch (IllegalArgumentException | UnsupportedEncodingException ignored) {
            return null;
        }
    }

    private static boolean containsControlCharacter(String value) {
        for (int index = 0; index < value.length(); index++) {
            char character = value.charAt(index);
            if (character < 0x20 || character == 0x7f) {
                return true;
            }
        }
        return false;
    }
}
