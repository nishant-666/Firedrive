import React, { useEffect } from 'react';
import GoogleButton from 'react-google-button';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged
} from 'firebase/auth'
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Auth() {
    let auth = getAuth();
    let googleProvider = new GoogleAuthProvider();
    let navigate = useNavigate();
    const signUp = () => {
        signInWithPopup(auth, googleProvider)
            .then(res => {
                localStorage.setItem('userEmail', res.user.email);
                toast.success("Logged In!")
                setTimeout(() => {
                    navigate('/drive')
                }, 1000)
            })
            .catch(err => {
                toast.error(err.message)
            })
    }

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate('/drive')
            }
            else {
                navigate('/')
            }
        })
    }, [])
    return (
        <div className='auth-btn'>
            <ToastContainer />
            <h1>Sign In with Google..</h1>
            <GoogleButton
                onClick={signUp}
            />
        </div>
    )
}
