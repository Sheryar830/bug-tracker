import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      {/* Sidebar area EXACT class/id */}
      <div className="sidebar-area" id="sidebar-area">
        <Sidebar />
      </div>

      {/* Main content area EXACT structure */}
      <div className="container-fluid">
        <div className="main-content d-flex flex-column" style={{background : "#eff3f9"}}>
          <Header />
          <div className="main-content-container overflow-hidden" >
            <Outlet />
          </div>
          <div className="flex-grow-1" />
          <Footer />
        </div>
      </div>
    </>
  );
}
