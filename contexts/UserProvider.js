"use client"
import React, { useState } from 'react';
import UserContext from './UserContext';

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const getUser = async () => {
      const resp = await fetch("http://localhost:3000/api/getuser",{
        method:'POST',
        headers:{
          "token": localStorage.getItem('token'),
        }
      })
      
      const res = await resp.json();
      if(res.success){
        setUser(res.user);
        return res.user;
      }
      else{
        setUser(null);
        return null;
      }
    }

    return (
      <UserContext.Provider value={{ user, getUser, setUser }}>
        {children}
      </UserContext.Provider>
    );
};