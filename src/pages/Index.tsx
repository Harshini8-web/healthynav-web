import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/auth');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="text-center space-y-4">
        <Dumbbell className="w-16 h-16 text-primary mx-auto animate-pulse" />
        <p className="text-muted-foreground">Redirecting to sign in...</p>
      </div>
    </div>
  );
};

export default Index;
