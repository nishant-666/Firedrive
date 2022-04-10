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
    onSnapshot,
} from 'firebase/firestore'

export default function Drive({
    database
}) {
    let navigate = useNavigate();
    let auth = getAuth();
    const storage = getStorage();
    const [progress, setProgress] = useState(null)
    const collectionRef = collection(database, 'driveData')
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
            folderName: folderName,
            fileLink: [{
                downloadURL: '',
                fileName: ''
            }]
        })
            .then(() => {
                setIsModalVisible(false);
                // alert('Folder Added')
                setFolderName('')
            })
            .catch(err => {
                alert(err.message)
            })
    }

    const getFile = (event) => {
        const fileRef = ref(storage, event.target.files[0].name);
        const uploadTask = uploadBytesResumable(fileRef, event.target.files[0]);
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(Math.round(progress))
                switch (snapshot.state) {
                    case 'paused':
                        console.log('Upload is paused');
                        break;
                    case 'running':
                        console.log('Upload is running');
                        break;
                }
            },
            (error) => {
                console.log(error.message)
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setProgress(null)
                    addDoc(collectionRef, {
                        fileName: event.target.files[0].name,
                        downloadURL: downloadURL
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
                navigate('/')
            })
            .catch(err => {
                alert(err.message)
            })
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
            <div className='title-container'>
                <h1>FireDrive</h1>
            </div>
            <div className='icon-container'>
                <div class="upload-btn-wrapper">
                    <FiFilePlus
                        color='#ffc107'
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
                    color='#ffc107'
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
                    return (
                        <div
                            className='grid-child'
                            onClick={() => folder.folderName ? openFolder(folder.id) : openFile(folder.downloadURL)}
                        >
                            <h4>
                                {folder.folderName ?
                                    folder.folderName :
                                    folder.fileName}
                            </h4>
                        </div>
                    )
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
