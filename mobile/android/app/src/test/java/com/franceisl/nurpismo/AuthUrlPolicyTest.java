package com.franceisl.nurpismo;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public final class AuthUrlPolicyTest {
    private static final String CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
    private static final String BASE =
            "https://xzzngrquomyiglktroqi.supabase.co/auth/v1/authorize";
    private static final String REQUIRED_GOOGLE_QUERY =
            "provider=google"
                    + "&redirect_to=com.franceisl.nurpismo%3A%2F%2Fauth%2Fcallback"
                    + "&code_challenge=" + CHALLENGE
                    + "&code_challenge_method=s256";

    @Test
    public void acceptsExactSupabaseAuthorizeEndpointWithRequiredPkceParameters() {
        assertTrue(AuthUrlPolicy.isAllowedAuthorizeUrl(
                BASE + "?" + REQUIRED_GOOGLE_QUERY
        ));
        assertTrue(AuthUrlPolicy.isAllowedAuthorizeUrl(
                "https://XZZNGRQUOMYIGLKTROQI.SUPABASE.CO/auth/v1/authorize"
                        + "?provider=facebook"
                        + "&redirect_to=com.franceisl.nurpismo%3A%2F%2Fauth%2Fcallback"
                        + "&code_challenge=" + CHALLENGE
                        + "&code_challenge_method=S256"
                        + "&skip_http_redirect=true&scopes=email%20profile"
        ));
    }

    @Test
    public void rejectsWrongAuthorizeOriginOrPath() {
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                "http://xzzngrquomyiglktroqi.supabase.co/auth/v1/authorize?" + REQUIRED_GOOGLE_QUERY
        ));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                "https://evil.example/xzzngrquomyiglktroqi.supabase.co/auth/v1/authorize?"
                        + REQUIRED_GOOGLE_QUERY
        ));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                "https://xzzngrquomyiglktroqi.supabase.co.evil.example/auth/v1/authorize?"
                        + REQUIRED_GOOGLE_QUERY
        ));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                "https://evil.example@xzzngrquomyiglktroqi.supabase.co/auth/v1/authorize?"
                        + REQUIRED_GOOGLE_QUERY
        ));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                "https://xzzngrquomyiglktroqi.supabase.co:443/auth/v1/authorize?"
                        + REQUIRED_GOOGLE_QUERY
        ));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                "https://xzzngrquomyiglktroqi.supabase.co/auth/v1/authorize/../token?"
                        + REQUIRED_GOOGLE_QUERY
        ));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                BASE + "?" + REQUIRED_GOOGLE_QUERY + "#unexpected"
        ));
    }

    @Test
    public void rejectsMissingInvalidOrDuplicateRequiredAuthorizeParameters() {
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(BASE + "?provider=google"));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                BASE + "?" + REQUIRED_GOOGLE_QUERY.replace("provider=google", "provider=github")
        ));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                BASE + "?" + REQUIRED_GOOGLE_QUERY
                        .replace("com.franceisl.nurpismo%3A%2F%2Fauth%2Fcallback", "https%3A%2F%2Fevil.example%2Fcallback")
        ));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                BASE + "?" + REQUIRED_GOOGLE_QUERY.replace(CHALLENGE, "too-short")
        ));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                BASE + "?" + REQUIRED_GOOGLE_QUERY.replace(CHALLENGE, CHALLENGE + "%3D")
        ));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                BASE + "?" + REQUIRED_GOOGLE_QUERY.replace("code_challenge_method=s256", "code_challenge_method=plain")
        ));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                BASE + "?" + REQUIRED_GOOGLE_QUERY + "&provider=facebook"
        ));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                BASE + "?" + REQUIRED_GOOGLE_QUERY
                        + "&redirect_to=com.franceisl.nurpismo%3A%2F%2Fauth%2Fcallback"
        ));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                BASE + "?" + REQUIRED_GOOGLE_QUERY + "&code_challenge=" + CHALLENGE
        ));
        assertFalse(AuthUrlPolicy.isAllowedAuthorizeUrl(
                BASE + "?" + REQUIRED_GOOGLE_QUERY + "&code_challenge_method=s256"
        ));
    }

    @Test
    public void acceptsExactPkceCallbackAndPreservesProviderErrors() {
        assertTrue(AuthUrlPolicy.isAllowedCallbackUrl(
                "com.franceisl.nurpismo://auth/callback?code=one-time-code"
        ));
        assertTrue(AuthUrlPolicy.isAllowedCallbackUrl(
                "com.franceisl.nurpismo://auth/callback?error=access_denied&error_description=Cancelled"
        ));
        assertTrue(AuthUrlPolicy.isAllowedCallbackUrl(
                "com.franceisl.nurpismo://AUTH/callback?code=one-time-code&safe_extra=value"
        ));

        assertFalse(AuthUrlPolicy.isAllowedCallbackUrl(
                "https://auth/callback?code=one-time-code"
        ));
        assertFalse(AuthUrlPolicy.isAllowedCallbackUrl(
                "com.franceisl.nurpismo://evil/callback?code=one-time-code"
        ));
        assertFalse(AuthUrlPolicy.isAllowedCallbackUrl(
                "com.franceisl.nurpismo://auth/callback/extra?code=one-time-code"
        ));
        assertFalse(AuthUrlPolicy.isAllowedCallbackUrl(
                "com.franceisl.nurpismo://user@auth/callback?code=one-time-code"
        ));
        assertFalse(AuthUrlPolicy.isAllowedCallbackUrl(
                "com.franceisl.nurpismo:auth/callback?code=one-time-code"
        ));
        assertFalse(AuthUrlPolicy.isAllowedCallbackUrl(
                "com.franceisl.nurpismo://auth/callback#access_token=legacy"
        ));
        assertFalse(AuthUrlPolicy.isAllowedCallbackUrl(
                "com.franceisl.nurpismo://auth/callback?code=one&code=two"
        ));
        assertFalse(AuthUrlPolicy.isAllowedCallbackUrl(
                "com.franceisl.nurpismo://auth/callback?error=one&%65rror=two"
        ));
        assertFalse(AuthUrlPolicy.isAllowedCallbackUrl(
                "com.franceisl.nurpismo://auth/callback?error=one&error_description=a&error_description=b"
        ));
        assertFalse(AuthUrlPolicy.isAllowedCallbackUrl(null));
        assertFalse(AuthUrlPolicy.isAllowedCallbackUrl("not a url"));
    }
}
