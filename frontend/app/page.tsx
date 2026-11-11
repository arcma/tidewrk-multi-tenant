'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { api, token } from '@/lib/api';

type Tenant = { id: number; name: string };
type User = { name: string; email: string };
type Project = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  due_date?: string | null;
  tasks_count?: number;
};
type Task = { id: number; title: string; status: string; priority: string };

const statusLabel = (value: string) =>
  value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [projectBusy, setProjectBusy] = useState(false);
  const [taskBusy, setTaskBusy] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'projects'>('overview');
  const authLock = useRef(false);
  const projectLock = useRef(false);
  const taskLock = useRef(false);

  async function refresh() {
    const me = await api<{ user: User; tenants: Tenant[] }>('/me');
    setUser(me.user);
    const currentTenant = me.tenants[0];
    setTenant(currentTenant || null);

    const projectResult = await api<{ data: Project[] }>('/projects', {
      headers: currentTenant ? { 'X-Tenant-ID': String(currentTenant.id) } : {},
    });
    setProjects(projectResult.data || []);
    setAuthed(true);
  }

  useEffect(() => {
    let mounted = true;
    if (!token()) {
      setCheckingAuth(false);
      return;
    }
    refresh()
      .catch(() => {
        localStorage.removeItem('tidewrk_token');
        if (mounted) setAuthed(false);
      })
      .finally(() => {
        if (mounted) setCheckingAuth(false);
      });
    return () => { mounted = false; };
  }, []);

  async function auth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authLock.current) return;
    authLock.current = true;
    setAuthBusy(true);
    setError('');
    setNotice('');
    const form = new FormData(event.currentTarget);
    const body: Record<string, string> = {
      email: String(form.get('email') || ''),
      password: String(form.get('password') || ''),
    };
    if (mode === 'register') {
      body.name = String(form.get('name') || '');
      body.company_name = String(form.get('company_name') || '');
      body.password_confirmation = String(form.get('password_confirmation') || '');
    }
    try {
      const result = await api<{ token: string }>('/' + mode, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      localStorage.setItem('tidewrk_token', result.token);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to continue. Please try again.');
    } finally {
      authLock.current = false;
      setAuthBusy(false);
    }
  }

  async function addProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (projectLock.current) return;
    projectLock.current = true;
    setProjectBusy(true);
    setError('');
    setNotice('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: String(form.get('name') || ''),
      description: String(form.get('description') || ''),
    };
    try {
      await api('/projects', { method: 'POST', body: JSON.stringify(payload) });
      formElement.reset();
      await refresh();
      setNotice('Project created.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create project.');
    } finally {
      projectLock.current = false;
      setProjectBusy(false);
    }
  }

  async function selectProject(id: number) {
    setSelected(id);
    setError('');
    try {
      const result = await api<Task[]>(`/projects/${id}/tasks`);
      setTasks(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load tasks.');
    }
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || taskLock.current) return;
    taskLock.current = true;
    setTaskBusy(true);
    setError('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      title: String(form.get('title') || ''),
      priority: String(form.get('priority') || 'medium'),
    };
    try {
      await api(`/projects/${selected}/tasks`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      formElement.reset();
      await selectProject(selected);
      setNotice('Task added.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add task.');
    } finally {
      taskLock.current = false;
      setTaskBusy(false);
    }
  }

  async function logout() {
    try { await api('/logout', { method: 'POST' }); } catch { /* Token is cleared locally either way. */ }
    localStorage.removeItem('tidewrk_token');
    setAuthed(false);
    setUser(null);
    setTenant(null);
    setProjects([]);
    setTasks([]);
    setSelected(null);
    setMode('login');
  }

  if (checkingAuth) {
    return <main className="loading-screen"><span className="wordmark"><span className="wordmark-mark">t</span> tidewrk</span><p>Opening your workspace…</p></main>;
  }

  if (!authed) {
    return (
      <main className="auth-page">
        <section className="auth-aside">
          <span className="wordmark"><span className="wordmark-mark">t</span> tidewrk</span>
          <div className="auth-message">
            <p className="eyebrow">A CLEARER WAY TO WORK</p>
            <h1>Keep the work moving.</h1>
            <p>Projects, tasks, and people in one straightforward workspace.</p>
          </div>
          <span className="auth-footnote">Tidewrk · Workspace management</span>
        </section>
        <section className="auth-main">
          <div className="auth-form-wrap">
            <p className="eyebrow">{mode === 'register' ? 'GET STARTED' : 'WELCOME BACK'}</p>
            <h2>{mode === 'register' ? 'Create your workspace' : 'Sign in to Tidewrk'}</h2>
            <p className="subtle">{mode === 'register' ? 'Set up a workspace for your team.' : 'Enter your details to continue.'}</p>
            <form className="form-stack" onSubmit={auth}>
              {mode === 'register' && <>
                <label>Your name<input name="name" required autoComplete="name" placeholder="Your name" /></label>
                <label>Company name<input name="company_name" required autoComplete="organization" placeholder="Company or team" /></label>
              </>}
              <label>Email address<input name="email" type="email" required autoComplete="email" placeholder="you@company.com" /></label>
              <label>Password<input name="password" type="password" minLength={8} required autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="At least 8 characters" /></label>
              {mode === 'register' && <label>Confirm password<input name="password_confirmation" type="password" minLength={8} required autoComplete="new-password" placeholder="Enter your password again" /></label>}
              {error && <p className="feedback error">{error}</p>}
              <button className="button button-primary button-full" type="submit" disabled={authBusy}>
                {authBusy ? 'Please wait…' : mode === 'register' ? 'Create workspace' : 'Sign in'}
              </button>
            </form>
            <p className="auth-switch">
              {mode === 'register' ? 'Already have an account?' : 'New to Tidewrk?'}
              <button type="button" className="text-button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}>
                {mode === 'register' ? 'Sign in' : 'Create a workspace'}
              </button>
            </p>
          </div>
          <span className="mobile-wordmark"><span className="wordmark-mark">t</span> tidewrk</span>
        </section>
      </main>
    );
  }

  const selectedProject = projects.find((project) => project.id === selected);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <span className="wordmark"><span className="wordmark-mark">t</span> tidewrk</span>
          <div className="workspace-switcher">
            <span className="workspace-avatar">{tenant?.name?.charAt(0).toUpperCase() || 'W'}</span>
            <span className="workspace-name"><strong>{tenant?.name || 'Workspace'}</strong><small>Workspace</small></span>
            <span className="chevron">⌄</span>
          </div>
          <p className="nav-caption">WORKSPACE</p>
          <nav className="side-nav" aria-label="Main navigation">
            <button className={activeView === 'overview' ? 'nav-item selected' : 'nav-item'} onClick={() => setActiveView('overview')}><span className="nav-symbol">⌂</span> Overview</button>
            <button className={activeView === 'projects' ? 'nav-item selected' : 'nav-item'} onClick={() => setActiveView('projects')}><span className="nav-symbol">▤</span> Projects <span className="nav-count">{projects.length}</span></button>
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="user-card">
            <span className="user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
            <span className="user-details"><strong>{user?.name}</strong><small>{user?.email}</small></span>
            <button className="more-button" aria-label="Sign out" title="Sign out" onClick={logout}>···</button>
          </div>
          <button className="signout-link" onClick={logout}>Sign out</button>
        </div>
      </aside>

      <section className="content-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-separator">/</span><strong>{activeView === 'overview' ? 'Overview' : 'Projects'}</strong></div>
          <div className="topbar-right"><span className="connection-dot" /> All changes saved</div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">{tenant?.name || 'YOUR WORKSPACE'}</p>
              <h1>{activeView === 'overview' ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${user?.name?.split(' ')[0] || 'there'}.` : 'Projects'}</h1>
              <p className="subtle">{activeView === 'overview' ? 'Here’s what’s happening in your workspace.' : 'Keep track of the work your team is moving forward.'}</p>
            </div>
            <span className="date-label">{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}</span>
          </div>

          {(error || notice) && <p className={`feedback ${error ? 'error' : 'success'}`}>{error || notice}</p>}

          {activeView === 'overview' && (
            <section className="summary-grid" aria-label="Workspace summary">
              <article className="summary-item"><span className="summary-label">TOTAL PROJECTS</span><strong>{projects.length}</strong><span className="summary-note">In this workspace</span></article>
              <article className="summary-item"><span className="summary-label">TASKS</span><strong>{tasks.length}</strong><span className="summary-note">{selectedProject ? `In ${selectedProject.name}` : 'Select a project to view tasks'}</span></article>
              <article className="summary-item"><span className="summary-label">WORKSPACE</span><strong className="summary-role">Active</strong><span className="summary-note">Your workspace is ready</span></article>
            </section>
          )}

          <div className="work-grid">
            <section className="surface projects-surface">
              <div className="section-heading">
                <div><h2>{activeView === 'overview' ? 'Your projects' : 'All projects'}</h2><p>{projects.length} {projects.length === 1 ? 'project' : 'projects'} in this workspace</p></div>
              </div>
              <form className="inline-create" onSubmit={addProject}>
                <input name="name" required aria-label="Project name" placeholder="Name a new project…" />
                <input name="description" aria-label="Project description" placeholder="Short description (optional)" />
                <button className="button button-primary" type="submit" disabled={projectBusy}>{projectBusy ? 'Adding…' : 'Add project'}</button>
              </form>
              <div className="table-wrap">
                <table className="project-table">
                  <thead><tr><th>PROJECT</th><th>STATUS</th><th>DESCRIPTION</th><th></th></tr></thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className={selected === project.id ? 'row-active' : ''} onClick={() => selectProject(project.id)}>
                        <td><button className="project-name" type="button" onClick={(event) => { event.stopPropagation(); selectProject(project.id); }}><span className="project-icon">▤</span><strong>{project.name}</strong></button></td>
                        <td><span className={`status-pill status-${project.status}`}>{statusLabel(project.status)}</span></td>
                        <td className="description-cell">{project.description || '—'}</td>
                        <td className="row-arrow">›</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!projects.length && <div className="empty-state"><span className="empty-icon">▤</span><strong>No projects yet</strong><p>Create a project above to give your team a place to start.</p></div>}
              </div>
            </section>

            <section className="surface tasks-surface">
              <div className="section-heading">
                <div><h2>{selectedProject ? selectedProject.name : 'Project tasks'}</h2><p>{selectedProject ? 'Tasks in this project' : 'Select a project to see its tasks'}</p></div>
                {selectedProject && <span className="task-count">{tasks.length}</span>}
              </div>
              {selectedProject ? <>
                <form className="task-create" onSubmit={addTask}>
                  <input name="title" required aria-label="Task title" placeholder="Add a task…" />
                  <select name="priority" aria-label="Task priority" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
                  <button className="button button-primary" type="submit" disabled={taskBusy}>{taskBusy ? '…' : '+'}</button>
                </form>
                <div className="task-list">
                  {tasks.map((task) => <div className="task-row" key={task.id}><span className={`task-check ${task.status === 'done' ? 'is-done' : ''}`}>{task.status === 'done' ? '✓' : ''}</span><span className="task-title">{task.title}</span><span className={`priority priority-${task.priority}`}>{statusLabel(task.priority)}</span></div>)}
                  {!tasks.length && <div className="task-empty">Nothing here yet. Add the first task above.</div>}
                </div>
              </> : <div className="task-placeholder"><span className="empty-icon">↳</span><p>Choose a project from the list to view and add its tasks.</p></div>}
            </section>
          </div>
          <footer className="page-footer"><span>© 2026 Tidewrk</span><span>Workspace management</span></footer>
        </div>
      </section>
    </main>
  );
}
