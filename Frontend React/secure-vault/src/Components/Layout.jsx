import { Outlet } from 'react-router-dom'
import NavigationBar from './NavigationBar';

function Layout() {
  return (
    <>
      <NavigationBar />
        <div className='content'>
            <Outlet />
        </div>
    </>
  );
}

export default Layout;