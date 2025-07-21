
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Building2,
  HardHat,
  Check,
  ShieldCheck
} from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [username, setUsername] = useState('string');
  const [password, setPassword] = useState('string');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get the path the user was trying to access
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login({ username, password });
      toast({
        title: "Success",
        description: "You have been logged in successfully",
      });
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Error",
        description: "Failed to login. Please check your credentials.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

   return (
    <div className="flex items-center justify-center py-10 md:h-screen bg-blue-50">
      {/* Карточка */}
      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg overflow-hidden grid md:grid-cols-2">

        {/* ====== ЛЕВАЯ ПАНЕЛЬ: форма ====== */}
        <div className="p-10 flex flex-col">
          <div className="text-center">
            <img
              src="public/gq-contract.png"
              alt="GQ Contract"
              className="mb-2 h-30 w-52 mx-auto"
            />
            <h4 className="mb-8 text-xl font-semibold text-gray-800">
              Система управления электронными документами
            </h4>
          </div>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input 
                  id="username"
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input 
                  id="password"
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password" 
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
          
          {/* Контакты */}
          <div className="mt-auto flex flex-col items-center gap-1 pt-8 text-center text-sm text-gray-500">
            <span>Call центр: <a href="tel:+77710010254" className="text-blue-600 font-medium">+7 771 001 02 54</a></span>
            <span>© GQ Contract, 2025</span>
          </div>
        </div>

        {/* ====== ПРАВАЯ ПАНЕЛЬ: статичный контент ====== */}
        <div className="hidden md:flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="w-full h-full flex flex-col items-center justify-center gap-6 
                          bg-white/10 backdrop-blur-md p-10 md:p-16
                          shadow-lg ring-1 ring-white/20 text-center">
            <Building2 className="h-12 w-12 text-white/90" />
            <h3 className="text-3xl font-semibold tracking-tight text-white/90">
              Проектирование электрических и слаботочных систем
            </h3>
            <p className="max-w-2xl text-lg leading-relaxed text-white/80">
              Управляем проектами любой сложности — от концепции до ввода в эксплуатацию.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
