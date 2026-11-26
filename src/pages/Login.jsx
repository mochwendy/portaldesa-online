import React, { useState, useContext } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Eye, EyeOff, Mail, Lock, Key } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import GoogleIcon from '@/components/GoogleIcon';
import { safeReturnTo } from '@/lib/authReturnTo';
import { signInWithProvider } from '@/lib/authMfaFlow';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/lib/AuthContext';

const DEFAULT_PASSWORD = 'tagogapu123';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [otpCode, setOtpCode] = useState('');

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = searchParams.get('returnTo') || safeReturnTo() || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Ensure we navigate after success
      navigate(returnTo);
    } catch (err) {
      setError(err.message || 'Gagal masuk. Periksa koneksi jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.mfa_required) {
        setChallenge(result);
        return;
      }
      if (result?.access_token) base44.auth.setToken(result.access_token);
      navigate(returnTo);
    } catch (err) {
      setError(err.message || 'Kode verifikasi tidak sesuai');
    } finally {
      setLoading(false);
    }
  };

  if (challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
              <Key className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Verifikasi MFA</h1>
          </div>
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
            <p className="text-center text-sm text-muted-foreground mb-6">Masukkan kode dari aplikasi authenticator</p>
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <Button className="w-full h-12 font-medium mt-6" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Verifikasi'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="Masuk ke SIMDESTA"
      subtitle="Gunakan email/username terdaftar di Akun Pengguna"
      footer={
        <>
          <Link to="/forgot-password" className="text-primary font-medium hover:underline block mb-2">
            Lupa kata sandi?
          </Link>
          Belum punya akun?{' '}
          <Link to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")} className="text-primary font-medium hover:underline">
            Daftar
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={() => signInWithProvider("google", returnTo)}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Masuk dengan Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">atau</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email atau Username</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="login-email"
              type="text"
              autoComplete="username"
              autoFocus
              placeholder="email@desa.go.id atau username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Kata Sandi</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Key className="w-3 h-3" />
            Default password: <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">{DEFAULT_PASSWORD}</code>
            (untuk akun tanpa kata sandi tersimpan)
          </p>
        </div>

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Masuk...
            </>
          ) : (
            'Masuk'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}