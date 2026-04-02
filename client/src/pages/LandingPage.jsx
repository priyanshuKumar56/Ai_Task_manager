import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const LandingPage = () => {
  const { isAuthenticated } = useAuthStore();
  const [serverStatus, setServerStatus] = React.useState('checking');

  // Fast-Warmup: Hit the backend and worker to wake them up from hibernation
  React.useEffect(() => {
    const wakeup = async () => {
      try {
        // Ping backend and worker health simultaneously
        await Promise.all([
          api.get('/health/live'),
          fetch('https://ai-task-manager-8ajh.onrender.com/health/live').catch(() => {})
        ]);
        setServerStatus('online');
      } catch (err) {
        setServerStatus('offline');
      }
    };
    wakeup();
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  const techLinks = [
    { name: "React 18", color: "#61DAFB", desc: "Modern UI with Fast Refresh" },
    { name: "Node.js 20", color: "#339933", desc: "Event-driven Backend API" },
    { name: "Python 3.12", color: "#3776AB", desc: "Compute-intensive Workers" },
    { name: "Redis (Upstash)", color: "#DC382D", desc: "High-speed Task Queuing" },
    { name: "K3s (K8s)", color: "#326CE5", desc: "Automated Orchestration" },
    { name: "Argo CD", color: "#EF5B3C", desc: "GitOps Source-of-Truth" }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-purple-500 selection:text-white">
      {/* ─── Animated Ambient Background ───────────────────────────────── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-emerald-600/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100" />
      </div>

      {/* ─── Modern Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-800/50 backdrop-blur-md bg-[#020617]/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-xl italic tracking-tighter">AI</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white hidden sm:block">TASKFLOW</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to={isAuthenticated ? "/dashboard" : "/auth"} className="px-6 py-2.5 rounded-full bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
              {isAuthenticated ? "Go to Dashboard" : "Get Started"}
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative z-10 pt-40 pb-20 px-6 max-w-7xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center">
          <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 mb-8">
            <span className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-500 animate-pulse' : (serverStatus === 'offline' ? 'bg-red-500' : 'bg-blue-500 animate-pulse')}`} />
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              {serverStatus === 'online' ? 'Infrastructure is Online' : (serverStatus === 'offline' ? 'Cluster Offline' : 'Connecting to Cluster...')}
            </span>
          </motion.div>

          <motion.h1 variants={fadeIn} className="text-5xl md:text-8xl font-black text-white leading-none mb-8 tracking-tighter">
            Architected for <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Infinite Scale.
            </span>
          </motion.h1>

          <motion.p variants={fadeIn} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            A high-performance AI task processing engine built using the 
            <strong> MERN Stack</strong>, <strong>Python Workers</strong>, and 
            <strong> GitOps </strong> principles. Seamlessly process compute-heavy tasks with real-time observability.
          </motion.p>

          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/auth" className="px-10 py-4 rounded-2xl bg-white text-slate-950 font-bold text-lg hover:bg-slate-200 transition-all shadow-xl shadow-white/5">
              Build Your First Task
            </Link>
            <a href="https://github.com/priyanshuKumar56/Ai_Task_manager" target="_blank" rel="noreferrer" className="px-10 py-4 rounded-2xl bg-slate-900 border border-slate-800 font-bold text-lg hover:bg-slate-800 transition-all">
              Explore Repository
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Live Architecture Flow ────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="flex flex-col md:flex-row gap-8 items-stretch">
          {/* Node 1: Entry */}
          <div className="flex-1 p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm relative group">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg">01</div>
            <h3 className="text-2xl font-bold text-white mb-4">The Frontline</h3>
            <p className="text-slate-400 text-sm mb-6">User creates a task on the <strong>React (Vite)</strong> frontend. Secure <strong>JWT Auth</strong> ensures only valid requests reach our Node API.</p>
            <div className="flex gap-4">
              <span className="px-3 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-widest uppercase">React 18</span>
              <span className="px-3 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold tracking-widest uppercase">Tailwind</span>
            </div>
          </div>

          <div className="flex items-center justify-center text-slate-700 md:rotate-0 rotate-90">
             <svg className="w-8 h-8 animate-bounce-x" fill="currentColor" viewBox="0 0 24 24"><path d="M13.025 1l-2.847 2.828 6.176 6.172h-16.354v4h16.354l-6.176 6.172 2.847 2.828 10.975-11z"/></svg>
          </div>

          {/* Node 2: Queue */}
          <div className="flex-1 p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm relative glass-effect">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg">02</div>
            <h3 className="text-2xl font-bold text-white mb-4">The Nerve Center</h3>
            <p className="text-slate-400 text-sm mb-6"><strong>Node.js (Express)</strong> receives the task and pushes it to an <strong>Upstash Redis</strong> queue using <strong>BullMQ</strong>. No task is ever lost.</p>
            <div className="flex gap-4">
              <span className="px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold tracking-widest uppercase">Redis</span>
              <span className="px-3 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold tracking-widest uppercase">MongoDB</span>
            </div>
          </div>

          <div className="flex items-center justify-center text-red-500 md:rotate-0 rotate-90">
             <svg className="w-8 h-8 animate-bounce-x" fill="currentColor" viewBox="0 0 24 24"><path d="M13.025 1l-2.847 2.828 6.176 6.172h-16.354v4h16.354l-6.176 6.172 2.847 2.828 10.975-11z"/></svg>
          </div>

          {/* Node 3: Worker */}
          <div className="flex-1 p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm relative shadow-2xl shadow-emerald-500/5">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg">03</div>
            <h3 className="text-2xl font-bold text-white mb-4">The Engine Room</h3>
            <p className="text-slate-400 text-sm mb-6">Our <strong>Python 3.12 workers</strong> pick up jobs and stream real-time logs back via <strong>SSE</strong>. Processed data is synced in Atlas.</p>
            <div className="flex gap-4">
              <span className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase">Python</span>
              <span className="px-3 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest uppercase">Docker</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Detailed Tech Details ─────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
         <div className="grid md:grid-cols-2 gap-20 items-center">
            <div>
               <h2 className="text-4xl font-bold text-white mb-8">Production-Grade <br />Infrastructure</h2>
               <p className="text-slate-400 mb-8 leading-relaxed italic">&quot;It&apos;s not just a project; it&apos;s a blueprint for reliability.&quot;</p>
               <div className="space-y-8">
                  <div className="flex items-start gap-4">
                     <div className="w-1.5 h-12 bg-indigo-500 rounded-full" />
                     <div>
                        <h4 className="font-bold text-white">Containerized Excellence</h4>
                        <p className="text-sm text-slate-500">Multi-stage Docker builds ensure lightweight, secure images. No root execution, all-around security.</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <div className="w-1.5 h-12 bg-purple-500 rounded-full" />
                     <div>
                        <h4 className="font-bold text-white">Kubernetes Native</h4>
                        <p className="text-sm text-slate-500">Deployable with HPA configs. As tasks increase, our Python workers scale horizontally to meet demand.</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <div className="w-1.5 h-12 bg-pink-500 rounded-full" />
                     <div>
                        <h4 className="font-bold text-white">GitOps with Argo CD</h4>
                        <p className="text-sm text-slate-500">Source-of-truth managed in a separate infra repository. Automated sync and zero-drift deployments.</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {techLinks.map((tech, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                     <div className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: tech.color }}>{tech.name}</div>
                     <p className="text-[10px] text-slate-500 leading-tight">{tech.desc}</p>
                  </div>
               ))}
               <div className="col-span-2 p-6 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 backdrop-blur text-center">
                  <span className="text-indigo-400 font-bold text-sm tracking-widest uppercase">Verified Deployment 🏆</span>
               </div>
            </div>
         </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-slate-500 text-sm font-medium">© 2026 AI Task Processing Engine. Prepared for the Full Stack Intern Assignment.</div>
          <div className="flex gap-8 text-slate-400 font-bold tracking-tighter uppercase text-xs">
             <span className="hover:text-indigo-400 transition-colors pointer-events-none">Stable Release V.1.0</span>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
        .animate-bounce-x {
          animation: bounce-x 2s infinite ease-in-out;
        }
        .glass-effect {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.4) 100%);
        }
      `}} />
    </div>
  );
};

export default LandingPage;
