import { Session } from 'next-auth';
import Image from 'next/image';
import { signOut } from 'next-auth/react';

interface Props {
  session: Session | null;
}

export default function DashboardHeader({ session }: Props) {
  return (
    <header className="border-b shadow-lg" style={{ 
      borderColor: 'var(--neon-green)',
      backgroundColor: 'rgba(27, 43, 52, 0.9)',
      boxShadow: '0 4px 6px -1px rgba(0, 255, 135, 0.1), 0 2px 4px -1px rgba(0, 255, 135, 0.06)'
    }}>
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-3 animate-pulse" style={{ backgroundColor: 'var(--neon-green)' }}></div>
          <h1 className="text-2xl font-bold" style={{ 
            color: 'var(--neon-green)',
            textShadow: '0 0 5px rgba(0, 255, 135, 0.3)'
          }}>PULSE</h1>
          <div className="ml-4 px-2 py-1 text-xs rounded flex items-center" style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
            border: '1px solid var(--electric-blue)',
            color: 'var(--electric-blue)'
          }}>
            <span>COMMAND TERMINAL</span>
          </div>
        </div>
        
        {session?.user?.image && (
          <div className="flex items-center">
            <div className="mr-3 px-3 py-1 text-xs rounded" style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.3)', 
              border: '1px solid var(--neon-green)',
              color: 'var(--neon-green)'
            }}>
              USER: {session.user.name?.toUpperCase()}
            </div>
            <div className="relative">
              <div className="absolute inset-0 rounded-full" style={{ 
                border: '2px solid var(--neon-green)',
                boxShadow: '0 0 5px rgba(0, 255, 135, 0.5)',
                transform: 'scale(1.1)'
              }}></div>
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={36}
                height={36}
                className="rounded-full"
              />
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="ml-4 px-3 py-1 text-sm transition-all duration-200 rounded"
              style={{ 
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                color: 'var(--crimson-red)',
                border: '1px solid var(--crimson-red)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--crimson-red)';
                e.currentTarget.style.color = 'var(--dark-slate)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.1)';
                e.currentTarget.style.color = 'var(--crimson-red)';
              }}
            >
              DISCONNECT
            </button>
          </div>
        )}
      </div>
    </header>
  );
}