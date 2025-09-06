//
//  ContentView.swift
//  CooperativeShops
//
//  Created by Andy Lin on 2025/9/3.
//

import SwiftUI
import QRScanner

struct ContentView: View {
    @State private var isScanning = true
    @State private var showSheet = false
    @State private var verifiedData: QRData? = nil
    @State private var tourchActive = false
    @State private var id = UUID()
    @State private var isLoading = true
    
    var body: some View {
        VStack {
            HStack {
                Image(.logo)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(height: 40)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.horizontal)
            
            ZStack(alignment: .bottom) {
                QRScannerSwiftUIView(
                    configuration: .init(
                        animationDuration: 0.3,
                        isBlurEffectEnabled: true
                    ),
                    isScanning: $isScanning,
                    onSuccess: { qrData in
                        isScanning = false
                        
                        showSheet = true
                        
                        handleVerify(qrData: qrData)
                    }, onFailure: { error in
                        print(error)
                    }
                )
                .id(id)
                
                VStack {
                    Button {
                        isScanning.toggle()
                        id = UUID()
                        isLoading = false
                    } label: {
                        ZStack {
                            Circle()
                                .foregroundStyle(.white)
                            Circle()
                                .foregroundStyle(.black)
                                .padding(5)
                            Circle()
                                .foregroundStyle(.white)
                                .padding(7.5)
                        }
                    }
                    .frame(width: 70, height: 70)
                }
                .frame(maxWidth: .infinity)
                .padding(.bottom, 50)
                .padding(.top)
                .background(.black.opacity(0.4))
            }
            .ignoresSafeArea()
            .frame(maxHeight: .infinity)
            .sheet(isPresented: $showSheet) {
                verifiedData = nil
            } content: {
                VStack {
                    if let verifiedData {
                        SheetContent(verifiedData: verifiedData)
                    }else if isLoading {
                        LoadingCircleView()
                            .tint(.black)
                            .frame(width: 30, height: 30)
                            .padding()
                        
                        Text("Verifying QR data...")
                            .font(.callout)
                            .fontWeight(.medium)
                            .opacity(0.6)
                    }else {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(.yellow)
                        
                        Text("Invalid QR Code")
                    }
                }
                .presentationDetents([.fraction(0.27)])
            }
        }
    }
    
    func verifyQrCode(qrData: String) async -> ApiResponse<QRData>? {
        do {
            let url = URL(string: "https://cooperativeshops.org/api/qr/verify")
            guard let url else {
                return nil
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            
            let body: [String: String] = [
                "data": qrData
            ]
            
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("Status:", httpResponse.statusCode)
            }
            
            let decoded = try JSONDecoder().decode(ApiResponse<QRData>.self, from: data)
            print(decoded)
            return decoded
        }catch {
            print(error)
            return nil
        }
    }
    
    func handleVerify(qrData: String) {
        Task {
            isLoading = true
            
            let response = await verifyQrCode(qrData: qrData)
            
            guard let response else { return }
            guard (response.success) else { return }
            
            verifiedData = response.data
            
            isLoading = false
        }
    }
}

struct LoadingCircleView: View {
    var lineWidth: CGFloat = 4
    var trimAmount: CGFloat = 0.3 // portion of circle shown, e.g. 0.3 = 1/3
    @State private var isAnimating = false
    
    var body: some View {
        Circle()
            .trim(from: 0, to: trimAmount)
            .stroke(Color.accentColor, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
            .rotationEffect(.degrees(isAnimating ? 360 : 0))
            .animation(.linear(duration: 1).repeatForever(autoreverses: false), value: isAnimating)
            .onAppear { isAnimating = true }
    }
}

struct ApiError: Codable {
    let code: String
    let message: String
}

struct ApiResponse<Body: Codable>: Codable {
    let success: Bool
    let data: Body?
    let error: ApiError?
}

struct QRData: Codable, Equatable {
    let userId: String
    let schoolName: String
    let schoolAbbreviation: String
}

#Preview {
    ContentView()
}
