import React, { useState } from 'react';
import { CustomButton } from './UI'; // Import reusable components

const AuthPage = ({
  mode,
  setMode,
  handleAuth,
  loading,
  error
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const submitAuth = (e) => {
    e.preventDefault();
    
    if (mode === 'register' && password !== confirmPassword) {
      console.error("Passwords do not match");
      return; 
    }

    if (email && password) {
      handleAuth(email, password, mode);
    }
  };

  const isLogin = mode === 'login';
  const logoName = "Nexus AI";

  return (
    <div className="flex w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden mx-auto bg-white/5 backdrop-blur-sm border border-white/10 text-white">
      
      <div className="w-1/2 p-12 flex-col justify-center bg-black/10 hidden md:flex">
    	  <h1 className="text-5xl font-extrabold text-red-400 mb-4">
    	    {logoName}
    	  </h1>
  	  <p className="text-xl font-light text-white/80">
  	    {isLogin ? "Welcome Back. Your Digital World Awaits." : "Start Your Journey. Build Smarter, Faster."}
  	  </p>
  	  </div>

  	  <div className="w-full md:w-1/2 p-10"> 
  	    <h2 className="text-3xl font-bold text-white mb-8 text-center">
    	    {isLogin ? 'Sign In' : 'Create Account'}
  	    </h2>
    	    
  	    {error && <p className="text-red-400 text-center mb-4">{error}</p>}
    	    
  	    <form onSubmit={submitAuth} className="space-y-5">
  	      <div>
    	      <input
    	        type="email"
  	        value={email}
    	        onChange={(e) => setEmail(e.target.value)}
    	        required
  	        className="w-full p-4 mt-1 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent"
    	        placeholder="Email Address"
  	      />
  	      </div>
  	      <div>
  	        <input
  	          type="password"
  	          value={password}
  	          onChange={(e) => setPassword(e.target.value)}
  	          required
  	          className="w-full p-4 mt-1 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent"
  	          placeholder="Password"
  	        />
  	      </div>
    	      
  	      {!isLogin && (
  	        <div>
  	          <input
  	            type="password"
  	            value={confirmPassword}
  	            onChange={(e) => setConfirmPassword(e.target.value)}
  	            required
  	            className="w-full p-4 mt-1 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent"
  	            placeholder="Confirm Password"
  	          />
  	        </div>
  	      )}

  	      {isLogin && (
  	        <div className="text-center">
  	          <a href="#" className="text-sm text-red-400 hover:underline">
  	            Forgot Password?
  	          </a>
  	        </div>
  	      )}
  	      
  	      <CustomButton
  	        type="submit"
  	        className="w-full !py-3 text-base !bg-red-600 hover:!bg-red-700 !shadow-red-500/50"
  	        disabled={loading}
  	      >
  	        {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
  	      </CustomButton>

  	      <div className="flex items-center justify-center">
  	        <div className="flex-grow border-t border-white/20"></div>
  	      </div>

  	      <CustomButton
  	        type="button"
  	        className="w-full !py-3 text-base !bg-indigo-600 hover:!bg-indigo-700 !shadow-indigo-500/50"
  	        onClick={() => setMode(isLogin ? 'register' : 'login')}
  	        disabled={loading}
  	      >
  	        {isLogin ? 'Create New Account' : 'Already have an account? Sign In'}
  	      </CustomButton>

  	    </form>
  	  </div>
  	</div>
  );
};

export default AuthPage;