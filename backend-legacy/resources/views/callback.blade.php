<html>
<head>
  <meta charset="utf-8">
  <title>Callback</title>
  <script>
    window.opener.postMessage({
        access_token: "{{ $access_token }}",
        token_type: "{{ $token_type }}",
        expires_at: "{{ $expires_at }}",
        user: "{{ $user }}",
        provider: "{{ $provider }}"
      },
      "{{ $to }}"
    );
    window.close();
  </script>
</head>
<body>
</body>
</html>