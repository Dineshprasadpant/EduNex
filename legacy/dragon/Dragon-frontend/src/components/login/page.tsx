// components/auth/LoginForm.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, handleSuccessfulLogin, handleApiError } from '../../../apiCalls/login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LoginFormProps {
  initialEmail?: string;
  initialRememberMe?: boolean;
  onSuccess?: () => void;
}

export const LoginForm = ({
  initialEmail = '',
  initialRememberMe = false,
  onSuccess
}: LoginFormProps) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [rememberMe, setRememberMe] = useState(initialRememberMe);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const emailTouched = useRef(false);
  const passwordTouched = useRef(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const validateEmail = (value: string, setError = true): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value) {
      if (setError) setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(value)) {
      if (setError) setEmailError('Please enter a valid email address');
      return false;
    }

    if (setError) setEmailError('');
    return true;
  };

  const validatePassword = (value: string, setError = true): boolean => {
    if (!value) {
      if (setError) setPasswordError('Password is required');
      return false;
    }

    if (setError) setPasswordError('');
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      if (!isEmailValid && emailInputRef.current) {
        emailInputRef.current.focus();
      } else if (!isPasswordValid && passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginUser(email, password);
      const user = handleSuccessfulLogin(data, email, rememberMe);

      toast.success(`Welcome back, ${user.fullname || 'User'}!`);

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          router.push('/dashboard/introduction');
        }, 1000);
      }
    } catch (error) {
      handleApiError(error);

      // For debugging - mock login
      if (email === 'test@example.com' && password === 'password') {
        console.log("Using mock login for testing frontend");
        const mockUser = { fullname: 'Test User', email: 'test@example.com' };
        handleSuccessfulLogin({ token: 'mock-token', user: mockUser }, email, rememberMe);
        toast.success(`Welcome back, ${mockUser.fullname}! (Test Mode)`);
        setTimeout(() => {
          router.push('/dashboard/introduction');
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    setTimeout(() => {
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }, 0);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (formSubmitted || emailTouched.current) {
      validateEmail(value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (formSubmitted || passwordTouched.current) {
      validatePassword(value);
    }
  };

  const handleEmailBlur = () => {
    emailTouched.current = true;
    validateEmail(email);
  };

  const handlePasswordBlur = () => {
    passwordTouched.current = true;
    validatePassword(password);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          ref={emailInputRef}
          className={`w-full h-11 rounded-md ${emailError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
          aria-describedby="email-error"
          aria-invalid={!!emailError}
          autoComplete="username"
          placeholder="Enter your email"
          required
        />
        {emailError && <p id="email-error" className="text-sm text-red-500 mt-1">{emailError}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            ref={passwordInputRef}
            className={`w-full h-11 rounded-md pr-10 ${passwordError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
              }`}
            aria-describedby="password-error"
            aria-invalid={!!passwordError}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {passwordError && <p id="password-error" className="text-sm text-red-500 mt-1">{passwordError}</p>}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full py-3 bg-[#010794] hover:bg-blue-800 text-white rounded-md font-medium"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </div>
        ) : 'Sign In'}
      </Button>
    </form>
  );
};