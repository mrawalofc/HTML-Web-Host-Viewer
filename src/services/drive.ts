import { DriveFileItem } from '../types';

/**
 * List HTML and web files in the user's Google Drive created or accessible with this app
 */
export async function listHtmlFiles(accessToken: string): Promise<DriveFileItem[]> {
  try {
    const query = encodeURIComponent("mimeType = 'text/html' and trashed = false");
    const fields = encodeURIComponent("files(id, name, mimeType, modifiedTime, size, webViewLink)");
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc&pageSize=50`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Drive API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing Drive HTML files:', error);
    throw error;
  }
}

/**
 * Fetch raw file content from Google Drive by fileId
 */
export async function fetchFileContent(fileId: string, accessToken: string): Promise<string> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to fetch file content (${response.status}): ${errText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching file content from Drive:', error);
    throw error;
  }
}

/**
 * Save or update an HTML file directly to Google Drive
 */
export async function saveHtmlToDrive(
  name: string,
  content: string,
  accessToken: string,
  existingFileId?: string
): Promise<{ id: string; name: string; webViewLink?: string }> {
  try {
    const fileName = name.endsWith('.html') || name.endsWith('.htm') ? name : `${name}.html`;

    if (existingFileId) {
      // Update existing file content
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
      const updateResponse = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/html; charset=UTF-8',
        },
        body: content,
      });

      if (!updateResponse.ok) {
        const err = await updateResponse.text();
        throw new Error(`Failed to update file in Drive: ${err}`);
      }

      // Also update filename/metadata if needed
      const metaUrl = `https://www.googleapis.com/drive/v3/files/${existingFileId}?fields=id,name,webViewLink`;
      const metaResponse = await fetch(metaUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: fileName }),
      });

      if (metaResponse.ok) {
        const data = await metaResponse.json();
        return {
          id: data.id,
          name: data.name,
          webViewLink: data.webViewLink,
        };
      }

      return {
        id: existingFileId,
        name: fileName,
      };
    }

    // Create new file with multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: 'text/html',
      description: 'Created with HTML Web Host & Viewer',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
      content +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Drive create error (${response.status}): ${err}`);
    }

    const result = await response.json();
    return {
      id: result.id,
      name: result.name,
      webViewLink: result.webViewLink,
    };
  } catch (error) {
    console.error('Error saving to Drive:', error);
    throw error;
  }
}

/**
 * Delete a file in Google Drive
 */
export async function deleteDriveFile(fileId: string, accessToken: string): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const err = await response.text();
    throw new Error(`Drive delete error: ${err}`);
  }
}
