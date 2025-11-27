import { useUser, UserButton } from '@clerk/clerk-react';

export default function HomePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="home-page">
      <header className="header">
        <h1>Mood-Based Discovery</h1>
        <UserButton afterSignOutUrl="/sign-in" />
      </header>
      <main>
        <h2>Welcome, {user?.firstName || 'User'}!</h2>
        <p>Discover places based on your mood and preferences.</p>
        <p>The map and chat interface will be implemented in the next tasks.</p>
      </main>
    </div>
  );
}
