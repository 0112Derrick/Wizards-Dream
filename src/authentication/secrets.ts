import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
const client: SecretManagerServiceClient = new SecretManagerServiceClient({ projectId: 'bipoc-322918' });


async function accessSecretVersion(name) {
    let version: any;
    [version] = await client.accessSecretVersion({
        name: name,
    });

    // Extract the payload as a string.
    const payload = version.payload.data.toString();
    return payload;
}



const COOKIE_SECRET = await accessSecretVersion('projects/147003015602/secrets/WizardsDreams_SECRET/versions/1');
const MONGO_URI = await accessSecretVersion('projects/147003015602/secrets/MONGO_URI_WD_SECRET/versions/2');
//const COOKIE_SECRET = "123"
//const MONGO_URI = "123"
export { COOKIE_SECRET, MONGO_URI };