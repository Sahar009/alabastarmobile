//
//  FirebaseHelper.m
//  AlabastarMobile
//

#import "FirebaseHelper.h"
@import FirebaseCore;

@implementation FirebaseHelper

+ (BOOL)configureFirebaseIfAvailable {
    // Check if GoogleService-Info.plist exists
    NSString *path = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
    if (!path || ![[NSFileManager defaultManager] fileExistsAtPath:path]) {
        NSLog(@"[FirebaseHelper] ⚠️ GoogleService-Info.plist not found - Firebase disabled");
        return NO;
    }
    
    // Verify plist is valid
    NSDictionary *plist = [NSDictionary dictionaryWithContentsOfFile:path];
    if (!plist || !plist[@"PROJECT_ID"]) {
        NSLog(@"[FirebaseHelper] ⚠️ GoogleService-Info.plist is invalid - Firebase disabled");
        return NO;
    }
    
    // Try to configure Firebase with exception handling
    @try {
        [FIRApp configure];
        NSLog(@"[FirebaseHelper] ✅ Firebase configured successfully");
        return YES;
    }
    @catch (NSException *exception) {
        NSLog(@"[FirebaseHelper] ⚠️ Firebase configuration failed: %@", exception.reason);
        NSLog(@"[FirebaseHelper] App will continue without Firebase features");
        return NO;
    }
}

@end



