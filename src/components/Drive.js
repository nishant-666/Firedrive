import React, { useEffect, useState } from 'react';
import { FcOpenedFolder } from 'react-icons/fc';
import { FiFilePlus, FiLogOut } from 'react-icons/fi'
import { Modal, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import { signOut, getAuth, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
    collection,
    addDoc,
    onSnapshot
} from 'firebase/firestore';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function Drive({
    database
}) {
    let navigate = useNavigate();
    let auth = getAuth();
    let userEmail = localStorage.getItem('userEmail')
    const storage = getStorage();
    const [progress, setProgress] = useState(null)
    const collectionRef = collection(database, 'driveData');
    const [folderName, setFolderName] = useState('');
    const [folders, setFolders] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const folderUpload = () => {
        addDoc(collectionRef, {
            userEmail: userEmail,
            folderName: folderName,
            fileLink: [{
                downloadURL: '',
                fileName: ''
            }]
        })
            .then(() => {
                setIsModalVisible(false);
                toast.success("Folder Added", {
                    autoClose: 1500
                });
                // alert('Folder Added')
                setFolderName('')
            })
            .catch(err => {
                toast.error(err.message)
            })
    }

    const getFile = (event) => {
        const fileRef = ref(storage, event.target.files[0].name);
        const uploadTask = uploadBytesResumable(fileRef, event.target.files[0]);
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(Math.round(progress))
            },
            (error) => {
                toast.error(error.message, {
                    autoClose: 1500
                });
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setProgress(null)
                    addDoc(collectionRef, {
                        userEmail: userEmail,
                        fileName: event.target.files[0].name,
                        downloadURL: downloadURL
                    })
                    .then(() => {
                        toast.success("File Added", {
                            autoClose: 1500
                        });
                    })
                    .catch((err) => {
                        toast.error(err.message, {
                            autoClose: 1500
                        });
                    })
                });
            }
        )
    }

    const readData = () => {
        onSnapshot(collectionRef, (data) => {
            setFolders(data.docs.map((doc) => {
                return { ...doc.data(), id: doc.id }
            }))
        })
    }

    const openFolder = (id) => {
        navigate(`/folder/${id}`)
    }

    const openFile = (downloadURL) => {
        window.open(downloadURL, '_blank');
    }

    const logOut = () => {
        signOut(auth)
            .then(() => {
                localStorage.removeItem('userEmail');
                toast.success('Logged Out', {
                    autoClose: 1500
                });
                setTimeout(() => {
                    navigate('/');
                }, 1500)
            })
            .catch(err => {
                toast.error(err.message, {
                    autoClose: 1500
                });
            })
    }

    function limit (string = '', limit = 0) {  
        return string.substring(0, limit)
    }      

    const authState = () => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate('/drive')
            }
            else {
                navigate('/')
            }
        })
    }

    useEffect(() => {
        readData();
        authState()
    }, [])
    return (
        <div>
            <ToastContainer />
            <div className='title-container'>
                <h1>FireDrive</h1>
            </div>
            <div className='icon-container'>
                <div class="upload-btn-wrapper">
                    <FiFilePlus
                        color='#757575'
                        className='icon'
                        size={50} />
                    <input
                        type="file"
                        name="myfile"
                        onChange={getFile}
                    />
                </div>
                <FcOpenedFolder
                    size={50}
                    className='icon'
                    onClick={showModal}
                />

                <FiLogOut
                    color='#f44336'
                    size={50}
                    className='icon'
                    onClick={logOut}
                />
            </div>
            <div className='progress-bar-container'>
                {progress ? (
                    <ProgressBar completed={progress} />
                ) : (
                    <></>
                )}
            </div>
            <div className='grid-parent'>
                {folders.map((folder) => {
                    if(folder.userEmail === userEmail){
                        return (
                            <div
                                className='grid-child'
                                onClick={() => folder.folderName ? openFolder(folder.id) : openFile(folder.downloadURL)}
                            >
                                <h4>
                                    {
                                    folder.folderName ?
                                        folder.folderName :
                                        `${limit(folder.fileName, 20)}...`
                                    }
                                </h4>
                            </div>
                        )
                    }
                    else{
                        return <></>
                    }
                })}
            </div>
            <Modal
                title="Folder Upload"
                visible={isModalVisible}
                onOk={folderUpload}
                onCancel={handleCancel}
                centered
            >
                <Input
                    placeholder="Enter the Folder Name.."
                    onChange={(event) => setFolderName(event.target.value)}
                    value={folderName}
                />
            </Modal>
        </div>
    )
}
