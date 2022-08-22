import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
const client = new SecretManagerServiceClient({ projectId: 'bipoc-322918' });
async function accessSecretVersion(name) {
    let version;
    [version] = await client.accessSecretVersion({
        name: name,
    });
    const payload = version.payload.data.toString();
    return payload;
}
const COOKIE_SECRET = await accessSecretVersion('projects/147003015602/secrets/WizardsDreams_SECRET/versions/1');
const MONGO_URI = await accessSecretVersion('projects/147003015602/secrets/MONGO_URI_WD_SECRET/versions/2');
export { COOKIE_SECRET, MONGO_URI };
//# sourceMappingURL=secrets.js.map