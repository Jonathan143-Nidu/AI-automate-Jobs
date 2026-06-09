import { useState, useEffect } from 'react';
import { useBuilderState } from './useBuilderState';
import { useSettings } from './useSettings';
import { useSession } from 'next-auth/react';

export const useEmailAction = (state: ReturnType<typeof useBuilderState>) => {
    const { data: session } = useSession();
    const { signature } = useSettings();
    const {
        downloadUrl, downloadFileName, setIsEmailModalOpen, addLog, analysisResult,
        recruiterDetails, isEmailModalOpen, threadId,
        threadMetadata
    } = state;

    // DEBUG: Check if recruiter details are reaching here
    console.log('useEmailAction State:', { recruiterDetails, analysisResult });

    const [isSending, setIsSending] = useState(false);
    const [emailDetails, setEmailDetails] = useState({
        to: '',
        subject: '',
        message: ''
    });

    // Smart Auto-Drafting Logic
    useEffect(() => {
        if (isEmailModalOpen) {
            const { jobDetails, step } = state;
            console.log('📧 Email Modal Opened - Job Details:', jobDetails);
            console.log('📧 Recruiter Details:', recruiterDetails);
            // 1. SMART SUMMARY LOGIC: Use pitch, sanitizer, or force perfect match based on step
            let proseSummaryRaw = '';

            if (step === 'download') {
                // Post-Optimization: Force correct "Perfect Match" summary with more detail
                const candidate = analysisResult?.candidate_name || 'Candidate';
                const role = state.jobDetails.role || 'requested role';

                proseSummaryRaw = `I am pleased to present **${candidate}**, an exceptional professional who is a **perfect match** for your **${role}** requirement. After a thorough review of your job description, I have confirmed that this candidate has **matched the required technical skills** and experience needed to succeed in this role.<br><br>Beyond the core requirements, **${candidate}** brings a proven track record of delivering successful projects in complex environments. This profile combines hands-on expertise with a results-oriented mindset, ensuring they can make an **immediate positive impact** on your team. I strongly recommend reviewing the attached resume details.`;
            } else if (analysisResult?.email_pitch) {
                proseSummaryRaw = analysisResult.email_pitch;
            } else {
                // FALLBACK SANITIZER: Filter out all negative sentences from legacy data
                const rawSummary = (analysisResult?.executive_summary || '').trim();
                const sentences = rawSummary.match(/[^.!?]+[.!?]+/g) || [rawSummary];

                proseSummaryRaw = sentences
                    .filter(s => !s.match(/gap|missing|absent|lack|however|but|\[\[red|\[\[amber|mismatch|doesn't|does not|issue|concern/i)) // Remove negative sentences
                    .map(s => s.replace(/^[\-\*]\s*/, '').trim()) // clean bullets
                    .join(' ');
            }

            // Parse ONLY Bold syntax to HTML
            const proseSummary = proseSummaryRaw
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            // 2. Build the detailed position context string
            const roleStr = jobDetails.role ? `your ${jobDetails.role}` : 'your current requirement';
            const locStr = jobDetails.location ? ` in ${jobDetails.location}` : '';

            // Collect contract details (Rate, C2C/W2, Remote, etc)
            const details = [
                jobDetails.jobType,
                jobDetails.workStyle,
                jobDetails.rate
            ].filter(Boolean); // Remote nulls/undefined

            const detailsStr = details.length > 0 ? ` (${details.join(', ')})` : '';

            const draftBody = `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
<p style="margin: 0 0 16px 0;">Hi,</p>
<p style="margin: 0 0 16px 0;">Greetings for the day!</p>
<p style="margin: 0 0 16px 0;">Kindly find the attached <strong>resume</strong> of my consultant <strong>${analysisResult?.candidate_name || 'Candidate'}</strong> for your review. This profile is suitable for <strong>${roleStr}${locStr}${detailsStr}</strong>.</p>
<p style="margin: 0 0 16px 0;"><strong>Summary:</strong></p>
<p style="margin: 0 0 24px 0;">${proseSummary || 'Highly qualified professional with extensive experience matching the required performance profile.'}</p>
<div style="margin-top: 30px;">${signature || `Regards,<br><strong>Team Resume AI</strong>`}</div>
</div>`;

            // 3. Build the subject line: Role - Location - Candidate Name
            const subjectParts = [
                jobDetails.role || 'Position Inquiry',
                jobDetails.location,
                analysisResult?.candidate_name || 'Consultant'
            ].filter(Boolean); // Remove nulls

            setEmailDetails({
                to: recruiterDetails.email || '',
                subject: subjectParts.join(' - '),
                message: draftBody
            });
        }
    }, [isEmailModalOpen, recruiterDetails, analysisResult, signature, state.jobDetails, state]);

    // FORCE SYNC: Ensure email is populated even if it arrives late
    useEffect(() => {
        if (recruiterDetails.email && (!emailDetails.to || emailDetails.to === '')) {
            console.log("Force Syncing Email:", recruiterDetails.email);
            setEmailDetails(prev => ({ ...prev, to: recruiterDetails.email || '' }));
        }
    }, [recruiterDetails.email, emailDetails.to]);

    const sendEmail = async () => {
        if (!emailDetails.to || !downloadUrl) return;

        setIsSending(true);
        addLog('Preparing email package...', 'info');

        try {
            // Fetch the generated DOCX blob from the local URL
            const response = await fetch(downloadUrl);
            const blob = await response.blob();

            // Convert blob to base64 string for transmission
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    resolve(base64);
                };
            });
            reader.readAsDataURL(blob);
            const fileData = await base64Promise;

            // 4MB limit check (Safe margin below 4.5MB server limit)
            const isLargeFile = fileData.length * 0.75 > 4 * 1024 * 1024; // Base64 length * 0.75 ~= byte size

            let finalHtml = emailDetails.message;
            let finalFileData: string | undefined = fileData;
            let finalFileName: string | undefined = downloadFileName;

            if (isLargeFile) {
                addLog('File is large (>4MB). Uploading directly to Drive...', 'info');

                const accessToken = (session as { accessToken?: string })?.accessToken;
                if (!accessToken) throw new Error("No access token found. Please sign in again.");

                // 1. Initiate Resumable Upload
                const metadata = {
                    name: downloadFileName,
                    mimeType: blob.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                };

                const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(metadata)
                });

                if (!initRes.ok) throw new Error(`Drive Init Failed: ${initRes.statusText}`);
                const sessionUri = initRes.headers.get('Location');
                if (!sessionUri) throw new Error("Failed to get upload session URI");

                // 2. Upload File Data (Directly from Blob)
                const uploadRes = await fetch(sessionUri, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': metadata.mimeType
                    },
                    body: blob
                });

                if (!uploadRes.ok) throw new Error(`Drive Upload Failed: ${uploadRes.statusText}`);
                const fileData = await uploadRes.json();
                const fileId = fileData.id;

                // 3. Set Permissions to "Anyone with the link"
                await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ role: 'reader', type: 'anyone' })
                });

                // 4. Get WebViewLink (Ensure we have it)
                let driveLink = fileData.webViewLink;
                if (!driveLink) {
                    const getFileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    const getFileData = await getFileRes.json();
                    driveLink = getFileData.webViewLink;
                }

                addLog('Resume uploaded to Drive. Linking in email...', 'info');

                // Append link to email body
                finalHtml += `<br><br><p><strong>Note:</strong> Due to file size, the resume is available via this secure link: <a href="${driveLink}">${downloadFileName}</a></p>`;

                // Remove attachment data so it doesn't crash email send
                finalFileData = undefined;
                finalFileName = undefined;
            }

            const res = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: emailDetails.to,
                    subject: emailDetails.subject,
                    html: finalHtml,
                    fileName: finalFileName,
                    fileData: finalFileData,
                    accessToken: (session as { accessToken?: string })?.accessToken,
                    threadId: threadId,
                    threadMetadata: threadMetadata
                })
            });

            if (!res.ok) {
                const contentType = res.headers.get("content-type");
                let errorMessage = `Server Error: ${res.status} ${res.statusText}`;

                if (contentType && contentType.includes("application/json")) {
                    const errorData = await res.json();
                    errorMessage = errorData.error || errorMessage;
                } else {
                    // Ideally read text, but for 413/500 it might be HTML.
                    // Just use status text to be safe and avoid parsing huge HTML
                    const text = await res.text();
                    console.error("Non-JSON Error Response:", text.substring(0, 200)); // Log start of error

                    if (res.status === 413) {
                        errorMessage = "Attachment is too large. Please reduce the file size.";
                    }
                }

                throw new Error(errorMessage);
            }

            // Response processed


            addLog('Email sent successfully!', 'success');
            setIsEmailModalOpen(false);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error('Email send failed:', err);
            addLog(`Email failed: ${msg}`, 'error');
            alert(`Failed to send email: ${msg}`);
        } finally {
            setIsSending(false);
        }
    };

    return {
        emailDetails,
        setEmailDetails,
        isSending,
        sendEmail
    };
};
