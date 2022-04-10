import React from 'react';
import { Progress } from 'antd';

export default function ProgressBar({
    completed
}) {
    return (
        <div className='progress-bar'>
            <Progress percent={completed} />
        </div>
    )
}
