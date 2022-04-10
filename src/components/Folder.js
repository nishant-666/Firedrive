import React, { useEffect, useState } from 'react';
import { FiFilePlus } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeftCircle } from 'react-icons/fi';
import ProgressBar from './ProgressBar';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { updateDoc, doc, onSnapshot } from 'firebase/firestore'
export default function Folder({
    database
}) {
    const storage = getStorage();
    let navigate = useNavigate()
    let params = useParams();
    const [folders, setFolders] = useState([]);
    const [progress, setProgress] = useState(null)
    const [folderName, setFolderName] = useState('')
    const databaseRef = doc(database, 'driveData', params?.id)
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
                    updateDoc(databaseRef, {
                        fileLink: [...folders, {
                            downloadURL: downloadURL,
                            fileName: event.target.files[0].name
                        }]
                    })
                });
            }
        )
    }

    const readData = () => {
        onSnapshot(databaseRef, (doc) => {
            setFolders(doc.data().fileLink)
            setFolderName(doc.data().folderName)
        })
    }

    const openFile = (downloadURL) => {
        window.open(downloadURL, '_blank');
    }

    const goBack = () => {
        navigate('/drive')
    }

    useEffect(() => {
        readData();
    }, [])
    return (
        <div>
            <div className='back-icon'>
                <FiArrowLeftCircle
                    size={50}
                    onClick={goBack}
                />
            </div>
            <div className='icon-container'>
                <div class="upload-btn-wrapper">
                    <FiFilePlus
                        color='#ffc107'
                        className='icon'
                        size={50} />
                    <input
                        type="file"
                        onChange={getFile}
                        name="myfile" />
                </div>
            </div>
            <div className='folder-title'>
                <h1>{folderName}</h1>
            </div>
            {progress || progress === 100 ? (
                <ProgressBar completed={progress} />
            ) : (
                <></>
            )}
            <div className='grid-parent'>
                {folders?.map((folder) => {
                    return (
                        <>
                            {folder.downloadURL !== '' ? (
                                <div
                                    className='preview-child'
                                    onClick={() => openFile(folder.downloadURL)}
                                >   <img className='image-preview'
                                    src={folder.downloadURL} alt='image' />
                                    <h5>{folder.fileName}</h5>
                                </div>
                            ) : (
                                ""
                            )}
                        </>
                    )
                })}
            </div>
        </div>
    )
}
